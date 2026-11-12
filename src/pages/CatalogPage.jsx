import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { 
  Search, ShieldCheck, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ShoppingCart, BookOpen, Users, Star, Mail, 
  Library, BookmarkCheck 
} from "lucide-react";
import { fontDisplay, fontBody, getHomepageConfig } from "../theme";
import AnimatedSweepButton from "../components/AnimatedSweepButton";
import BookCover from "../components/BookCover";

function AutoMarquee({ items = [], speed = 36, className = "", renderItem }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const dragStateRef = useRef({ down: false, dragged: false, startX: 0, startScroll: 0 });
  const posRef = useRef(0);

  const baseItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    let list = [...items];
    while (list.length < 6) {
      list = [...list, ...items];
    }
    return list;
  }, [items]);

  const loopItems = useMemo(() => [...baseItems, ...baseItems], [baseItems]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || loopItems.length === 0) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    let rafId = 0;
    let lastTime = performance.now();
    posRef.current = el.scrollLeft;

    const step = (now) => {
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;

      const halfWidth = el.scrollWidth / 2;
      if (halfWidth > 0 && el.scrollWidth > el.clientWidth) {
        if (!pausedRef.current && !dragStateRef.current.down) {
          if (Math.abs(el.scrollLeft - posRef.current) > 2) {
            posRef.current = el.scrollLeft;
          }
          posRef.current += (speed * dt) / 1000;
          if (posRef.current >= halfWidth) {
            posRef.current -= halfWidth;
          }
          el.scrollLeft = posRef.current;
        } else {
          posRef.current = el.scrollLeft;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [loopItems.length, speed]);

  useEffect(() => {
    const onPointerMove = (e) => {
      const state = dragStateRef.current;
      const el = trackRef.current;
      if (!state.down || !el) return;

      const dx = e.clientX - state.startX;
      if (Math.abs(dx) > 6) {
        state.dragged = true;
      }
      if (!state.dragged) return;

      const halfWidth = el.scrollWidth / 2;
      let next = state.startScroll - dx;
      if (halfWidth > 0) {
        while (next < 0) next += halfWidth;
        while (next >= halfWidth) next -= halfWidth;
      }
      el.scrollLeft = next;
      posRef.current = next;
    };

    const onPointerUp = () => {
      if (!dragStateRef.current.down) return;
      dragStateRef.current.down = false;
      setTimeout(() => {
        dragStateRef.current.dragged = false;
      }, 40);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  if (loopItems.length === 0) return null;

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={() => { pausedRef.current = false; }}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") return;
        const el = trackRef.current;
        if (!el) return;
        dragStateRef.current = {
          down: true,
          dragged: false,
          startX: e.clientX,
          startScroll: el.scrollLeft,
        };
      }}
      onClickCapture={(e) => {
        if (dragStateRef.current.dragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onScroll={() => {
        const el = trackRef.current;
        if (!el) return;
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
          posRef.current = el.scrollLeft;
        }
      }}
      className={`flex items-center overflow-x-auto admin-tab-scroller touch-pan-x cursor-grab active:cursor-grabbing select-none [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] ${className}`}
    >
      {loopItems.map((item, idx) => renderItem(item, idx))}
    </div>
  );
}

export default function CatalogPage({ books, onNavigate }) {
  const [genre, setGenre] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [selectedPubType, setSelectedPubType] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");

  const handleSubscribe = async () => {
    if (!subscribeEmail || !subscribeEmail.includes("@")) {
      setSubscribeStatus("error");
      return;
    }
    setSubscribeStatus("loading");
    try {
      const { error } = await supabase.from('subscribers').insert([{ email: subscribeEmail }]);
      if (error && error.code !== '23505') throw error; // ignore duplicate email error
      setSubscribeStatus("success");
      setSubscribeEmail("");
      setTimeout(() => setSubscribeStatus(""), 3000);
    } catch (e) {
      console.error(e);
      setSubscribeStatus("error");
    }
  };
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [alphaFilter, setAlphaFilter] = useState("All");
  
  const [openFilters, setOpenFilters] = useState({
    alpha: false,
    pubType: true,
    subjects: true,
    author: true,
    date: true
  });

  const toggleFilter = (key) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const resetFilters = () => {
    setGenre("All");
    setSelectedAuthor("All");
    setSelectedPubType("All");
    setDateFilter("All");
    setDateFrom("");
    setDateTo("");
    setQuery("");
    setAlphaFilter("All");
    setCurrentPage(1);
  };

  useEffect(() => {
    const filter = localStorage.getItem("catalog_author_filter");
    if (filter) {
      setSelectedAuthor(filter);
      localStorage.removeItem("catalog_author_filter");
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesGenre = genre === "All" || b.genre === genre;
      const matchesAuthor = selectedAuthor === "All" || (b.author && b.author.toLowerCase().includes(selectedAuthor.toLowerCase()));
      // Assume 'Books' if pubType is undefined to support old data
      const bPubType = b.pubType || "Books";
      const matchesPubType = selectedPubType === "All" || bPubType === selectedPubType;
      
      let matchesDate = true;
      if (b.id) {
        const timestamp = parseInt(b.id.replace('b', ''));
        const now = Date.now();
        const diffDays = (now - timestamp) / (1000 * 60 * 60 * 24);
        
        if (dateFilter === "Custom") {
          const pubYear = b.firstPublish ? parseInt(b.firstPublish) : new Date(timestamp).getFullYear();
          if (dateFrom && pubYear < parseInt(dateFrom)) matchesDate = false;
          if (dateTo && pubYear > parseInt(dateTo)) matchesDate = false;
        } else if (dateFilter !== "All") {
          if (dateFilter === "Last Week") matchesDate = diffDays <= 7;
          else if (dateFilter === "Last Month") matchesDate = diffDays <= 30;
          else if (dateFilter === "Last 3 Months") matchesDate = diffDays <= 90;
          else if (dateFilter === "Last 6 Months") matchesDate = diffDays <= 180;
          else if (dateFilter === "Last 12 Months") matchesDate = diffDays <= 365;
          else if (dateFilter === "Last 2 Years") matchesDate = diffDays <= 730;
          else if (dateFilter === "Last 5 Years") matchesDate = diffDays <= 1825;
        }
      }

      const matchesAlpha = alphaFilter === "All" || (b.title && b.title[0].toUpperCase() === alphaFilter);

      const q = query ? query.toLowerCase() : "";
      const matchesQuery =
        !q.trim() ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.pages && b.pages.some(page => page && page.toLowerCase().includes(q)));
      
      return matchesGenre && matchesAuthor && matchesPubType && matchesDate && matchesAlpha && matchesQuery;
    });
  }, [books, genre, selectedAuthor, selectedPubType, dateFilter, dateFrom, dateTo, alphaFilter, query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [genre, selectedAuthor, selectedPubType, dateFilter, dateFrom, dateTo, alphaFilter, query, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filtered.length);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [totalPages, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    const target = document.getElementById("results-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const homepageConfig = useMemo(() => getHomepageConfig(), [books]);

  const trendingPool = useMemo(() => {
    const validBooks = (books || []).filter(b => b && b.id && b.title);
    if (homepageConfig.trendingMode === 'manual') {
      const manual = (homepageConfig.trendingBookIds || [])
        .map(id => validBooks.find(b => b.id === id))
        .filter(Boolean);
      if (manual.length > 0) return manual;
    }
    return validBooks.slice(0, 8);
  }, [books, homepageConfig]);

  const newReleases = useMemo(() => {
    if (homepageConfig.newReleasesMode === 'manual') {
      return homepageConfig.newReleasesBookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
    }
    return [...books].sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [books, homepageConfig]);

  const createdForYouBooks = useMemo(() => {
    if (homepageConfig.createdForYouMode === 'manual') {
      return homepageConfig.createdForYouBookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
    }
    return [...books].sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [books, homepageConfig]);
  
  const topAuthors = useMemo(() => {
    if (homepageConfig.featuredAuthorsMode === 'manual') {
      return homepageConfig.featuredAuthorsList;
    }
    return Array.from(new Set(books.map(b => b.author))).slice(0, 6);
  }, [books, homepageConfig]);

  return (
    <div className="admin-glass-backdrop min-h-screen text-[#111214] w-full max-w-full overflow-x-hidden" style={fontBody}>
      
      {/* HERO SECTION */}
      <section className="text-[#111214] py-8 sm:py-12 md:py-16 px-4 sm:px-6 relative z-30 overflow-visible w-full max-w-full">
        <div className="max-w-7xl mx-auto admin-glass-shell rounded-[30px] p-6 sm:p-10 md:p-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center relative z-30">
          
          <div className="lg:w-1/2 z-30 w-full relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight uppercase" style={fontDisplay}>
              Start Your Reading <span className="inline-block bg-[#F5F23B] px-2.5 py-0.5 rounded-xl text-[#111214] shadow-sm">Adventure</span> Invest In Books Today
            </h1>
            <p className="mt-4 sm:mt-6 text-sm md:text-base text-slate-700 max-w-lg leading-relaxed">
              Every title in the catalog, open to browse. Anyone can look through the full list below. 
              Reading a book requires an account — issued to your institution, or a free 30-day trial you can request yourself.
            </p>
            
            <search className="block mt-6 sm:mt-8 relative max-w-lg w-full z-40" ref={searchContainerRef}>
              <div className="flex items-center admin-glass-panel rounded-full p-1.5 w-full relative z-20">
                <Search size={18} className="ml-3.5 text-slate-600 flex-shrink-0" />
                <input
                  type="search"
                  aria-label="Search catalog titles, authors, or subjects"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search book here..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[#111214] placeholder:text-slate-500 w-full text-sm font-medium"
                />
                <AnimatedSweepButton 
                  onClick={() => {
                    setIsSearchOpen(false);
                    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  variant="yellow"
                  className="font-bold px-5 sm:px-7 py-2.5 rounded-full text-sm flex-shrink-0"
                >
                  Search
                </AnimatedSweepButton>
              </div>

              {/* Live Search Dropdown */}
              {isSearchOpen && query.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/92 backdrop-blur-xl rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-white">
                  {filtered.length > 0 ? (
                    <ul className="py-2 divide-y divide-slate-200/70">
                      {filtered.slice(0, 10).map((b) => (
                        <li 
                          key={b.id} 
                          onClick={() => {
                            setIsSearchOpen(false);
                            setQuery("");
                            onNavigate("book-details", b.id);
                          }}
                          className="px-4 py-3 hover:bg-white cursor-pointer flex items-start gap-4 transition-colors"
                        >
                          <BookCover book={b} className="w-10 h-14 flex-shrink-0 text-[10px] rounded-md shadow-sm" />
                          <div className="flex-1 min-w-0 pt-1">
                            <h4 className="text-[#111214] font-bold truncate text-sm">{b.title}</h4>
                            <p className="text-slate-600 text-xs truncate">{b.author}</p>
                            <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold">{b.genre}</p>
                          </div>
                          <div className="flex-shrink-0 text-[11px] font-bold text-[#111214] bg-[#F5F23B] px-3 py-1 rounded-full shadow-xs">
                            View Access
                          </div>
                        </li>
                      ))}
                      {filtered.length > 10 && (
                        <li 
                          className="px-4 py-3 text-center text-xs font-bold text-[#111214] hover:bg-white cursor-pointer bg-slate-100/70"
                          onClick={() => {
                            setIsSearchOpen(false);
                            document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          See all {filtered.length} results...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      No books found matching "{query}"
                    </div>
                  )}
                </div>
              )}
            </search>
            
            <div className="mt-6 sm:mt-8 flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
              <AnimatedSweepButton 
                onClick={() => onNavigate("trial")}
                variant="outline"
                className="text-xs sm:text-sm rounded-full px-5 py-2.5 bg-white/75 backdrop-blur-md border-white"
              >
                Request free trial
              </AnimatedSweepButton>
              <AnimatedSweepButton 
                onClick={() => onNavigate("login-reader")}
                variant="outline"
                className="text-xs sm:text-sm rounded-full px-5 py-2.5 bg-white/75 backdrop-blur-md border-white"
              >
                Institution login
              </AnimatedSweepButton>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col items-center z-10 w-full max-w-full mt-6 lg:mt-0 overflow-hidden">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <h2 className="text-2xl font-semibold text-[#111214]" style={fontDisplay}>Trending Now</h2>
            </div>
            <AutoMarquee
              items={trendingPool}
              speed={36}
              className="w-full gap-4 sm:gap-5 py-6 px-2"
              renderItem={(b, idx) => (
                <div
                  key={`${b.id}-trending-mq-${idx}`}
                  onClick={() => onNavigate("book-details", b.id)}
                  className="group/trending flex-shrink-0 relative cursor-pointer select-none transition-transform duration-300 ease-out hover:-translate-y-2.5"
                >
                  <div className="relative rounded-xl overflow-hidden transition-all duration-300 ease-out shadow-lg group-hover/trending:shadow-2xl group-hover/trending:ring-2 group-hover/trending:ring-[#F5F23B] group-hover/trending:ring-offset-2 group-hover/trending:ring-offset-white/60">
                    <BookCover
                      book={b}
                      className="w-28 h-40 sm:w-36 sm:h-52 md:w-44 md:h-64 rounded-xl transition-transform duration-300 ease-out group-hover/trending:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover/trending:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 pointer-events-none z-20">
                      <span className="bg-[#111214]/90 text-[#F5F23B] text-xs font-bold px-3 py-1 rounded-full border border-[#F5F23B]/70 shadow-lg flex items-center gap-1.5">
                        <BookOpen size={12} className="text-[#F5F23B]" /> View Book
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
          
          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, #FDD132 0%, transparent 50%)' }}>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-[#F5F23B]/95 backdrop-blur-md text-[#111214] py-4 relative z-10 border-y border-white/70">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-around items-center text-sm md:text-base font-bold uppercase tracking-wide gap-4 text-center">
          <div className="flex items-center gap-2"><BookOpen size={20} /> 10,000+ Titles</div>
          <div className="hidden sm:block w-px h-6 bg-black/20"></div>
          <div className="flex items-center gap-2"><Users size={20} /> 50,000+ Active Readers</div>
          <div className="hidden sm:block w-px h-6 bg-black/20"></div>
          <div className="flex items-center gap-2"><Star size={20} /> 4.9/5 Average Rating</div>
          <div className="hidden sm:block w-px h-6 bg-black/20"></div>
          <div className="flex items-center gap-2"><Library size={20} /> Institutional Access</div>
        </div>
      </section>

      {/* NEW RELEASES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-black/10 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111214]" style={fontDisplay}>New Releases</h2>
            <p className="text-sm text-slate-700 mt-2">What's new? Browse latest titles in the new releases category to discover your next read!</p>
          </div>
          <button 
            type="button"
            className="admin-glass-pill group inline-flex items-center gap-1.5 text-xs font-bold text-[#111214] hover:bg-[#111214] hover:text-[#F5F23B] px-4 py-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
            onClick={() => {
              setDateFilter("Last 3 Months");
              document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>View all</span>
            <ChevronRight size={15} className="transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newReleases.map(b => (
            <div 
              key={b.id} 
              onClick={() => onNavigate("book-details", b.id)}
              className="admin-glass-panel rounded-2xl group/card p-4 flex gap-4 cursor-pointer hover:border-[#111214]/40 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="font-bold text-sm leading-tight mb-1 text-[#111214] group-hover/card:underline transition-colors line-clamp-2" style={fontDisplay}>{b.title}</h3>
                <p className="text-xs text-slate-600 mb-2 truncate">{b.author}</p>
                <div className="mt-auto">
                  <div className="text-[11px] font-semibold text-slate-700 truncate mb-2" title={b.onlineIsbn ? `eISBN: ${b.onlineIsbn}` : ""}>
                    <span className="font-bold">eISBN:</span> {b.onlineIsbn || "—"}
                  </div>
                  <AnimatedSweepButton 
                    onClick={(e) => { e.stopPropagation(); onNavigate("book-details", b.id); }}
                    variant="card-subtle"
                    className="text-xs px-3 py-2 rounded-full w-full justify-center"
                  >
                    <BookOpen size={14} /> View book
                  </AnimatedSweepButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED AUTHORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-black/10 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-[#111214]" style={fontDisplay}>Featured Authors</h2>
          <button 
            type="button"
            className="admin-glass-pill group inline-flex items-center gap-1.5 text-xs font-bold text-[#111214] hover:bg-[#111214] hover:text-[#F5F23B] px-4 py-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
            onClick={() => onNavigate("authors")}
          >
            <span>View all authors</span>
            <ChevronRight size={15} className="transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-6 md:gap-8 justify-center md:justify-start py-2">
          {topAuthors.map((authorRaw, idx) => {
            const author = String(authorRaw || "");
            const words = author.split(/[\s,-]+/).filter(Boolean);
            const initials = words.length > 1 
              ? (words[0][0] + words[1][0]).toUpperCase() 
              : (words[0] ? words[0][0].toUpperCase() : '');
              
            return (
              <div 
                key={idx} 
                className="admin-glass-panel rounded-2xl p-4 w-[136px] flex flex-col items-center group/author cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-2 active:scale-95"
                onClick={() => {
                  setSelectedAuthor(author);
                  document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-slate-200 via-white to-amber-100 group-hover/author:from-[#F5F23B] group-hover/author:to-amber-200 flex items-center justify-center text-xl font-bold text-[#111214] mb-3 border-2 border-white shadow-sm transition-all duration-300 ease-out group-hover/author:scale-105">
                  <span>{initials}</span>
                </div>
                <p className="font-bold text-xs text-center text-[#111214] transition-all duration-200 line-clamp-2">
                  {author}
                </p>
                <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover/author:opacity-100 transition-opacity duration-200 mt-1">
                  View titles →
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATALOG SECTION WITH SIDEBAR */}
      <section id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-black/10 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-[#111214]" style={fontDisplay}>Browse Catalog</h2>
          <button 
            type="button"
            className="admin-glass-pill group inline-flex items-center gap-1.5 text-xs font-bold text-[#111214] hover:bg-[#111214] hover:text-[#F5F23B] px-4 py-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
            onClick={() => {
              setGenre("All");
              setSelectedAuthor("All");
              setSelectedPubType("All");
              setDateFilter("All");
              setDateFrom("");
              setDateTo("");
              setQuery("");
              setAlphaFilter("All");
            }}
          >
            <span>Clear Filters</span>
            <ChevronRight size={15} className="transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <aside className="lg:w-1/4 flex-shrink-0">
            {/* Mobile filter toggle */}
            <button
              type="button"
              className="lg:hidden w-full flex items-center justify-between admin-glass-panel rounded-2xl px-4 py-3 mb-4 font-bold text-sm text-[#111214]"
              onClick={() => setMobileFiltersOpen(o => !o)}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filters
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: mobileFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block admin-glass-panel rounded-[24px] p-5`}>
            <div className="mb-3 text-xs font-bold text-[#111214] uppercase tracking-wider flex justify-between items-center">
              Filters
            </div>
            <p className="text-xs text-slate-600 mb-5 pb-4 border-b border-black/10">
              Selecting a filter updates results automatically.
            </p>

            {/* Alphanumeric Filter */}
            <div className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer border-b border-gray-200 pb-3"
                onClick={() => toggleFilter('alpha')}
              >
                <h3 className="font-bold text-base text-black">Alphanumeric</h3>
                <span className="text-black">
                  {openFilters.alpha ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
              {openFilters.alpha && (
                <div className="pt-3 pb-4">
                  <div className="flex flex-wrap gap-1">
                    <button 
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${alphaFilter === "All" ? "bg-[#FDD132] text-black" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                      onClick={() => setAlphaFilter("All")}
                    >
                      #
                    </button>
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(char => (
                      <button 
                        key={char}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${alphaFilter === char ? "bg-[#FDD132] text-black" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                        onClick={() => setAlphaFilter(char)}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Publication Type */}
            <div className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer border-b border-gray-200 pb-3"
                onClick={() => toggleFilter('pubType')}
              >
                <h3 className="font-bold text-base text-black">Publication Type</h3>
                <span className="text-black">
                  {openFilters.pubType ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
              {openFilters.pubType && (
                <ul className="space-y-2 text-sm pt-3 pb-4">
                  <li 
                    className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${selectedPubType === "All" ? "font-bold text-black" : "text-black"}`}
                    onClick={() => setSelectedPubType("All")}
                  >
                    <span className="text-sm">All Types</span>
                  </li>
                  {Object.entries(books.reduce((acc, b) => { 
                    const p = b.pubType || "Books";
                    acc[p] = (acc[p] || 0) + 1; 
                    return acc; 
                  }, {})).sort((a, b) => b[1] - a[1]).map(([t, count]) => (
                    <li 
                      key={t}
                      className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${selectedPubType === t ? "font-bold text-black" : "text-black"}`}
                      onClick={() => setSelectedPubType(t)}
                    >
                      <span className="text-sm">{t}</span>
                      <span className="text-black text-xs">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Subjects Filter */}
            <div className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer border-b border-gray-200 pb-3"
                onClick={() => toggleFilter('subjects')}
              >
                <h3 className="font-bold text-base text-black">Subjects</h3>
                <span className="text-black">
                  {openFilters.subjects ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
              {openFilters.subjects && (
                <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2 custom-scrollbar pt-3 pb-4">
                  <li 
                    className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${genre === "All" ? "font-bold text-black" : "text-black"}`}
                    onClick={() => setGenre("All")}
                  >
                    <span className="text-sm">All Subjects</span>
                  </li>
                  {Object.entries(books.reduce((acc, b) => { acc[b.genre] = (acc[b.genre] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([g, count]) => (
                    <li 
                      key={g} 
                      className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${genre === g ? "font-bold text-black" : "text-black"}`}
                      onClick={() => setGenre(g)}
                    >
                      <span className="text-sm pr-2">{g}</span>
                      <span className="text-black text-xs">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Author Filter */}
            <div className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer border-b border-gray-200 pb-3"
                onClick={() => toggleFilter('author')}
              >
                <h3 className="font-bold text-base text-black">Author</h3>
                <span className="text-black">
                  {openFilters.author ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
              {openFilters.author && (
                <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2 custom-scrollbar pt-3 pb-4">
                  <li 
                    className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${selectedAuthor === "All" ? "font-bold text-black" : "text-black"}`}
                    onClick={() => setSelectedAuthor("All")}
                  >
                    <span className="text-sm">All Authors</span>
                  </li>
                  {Object.entries(books.reduce((acc, b) => { acc[b.author] = (acc[b.author] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([auth, count]) => (
                    <li 
                      key={auth} 
                      className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${selectedAuthor === auth ? "font-bold text-black" : "text-black"}`}
                      onClick={() => setSelectedAuthor(auth)}
                    >
                      <span className="truncate pr-2 text-sm">{auth}</span>
                      <span className="text-black text-xs">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Publication Date */}
            <div className="mb-2">
              <div 
                className="flex justify-between items-center cursor-pointer border-b border-black/10 pb-3"
                onClick={() => toggleFilter('date')}
              >
                <h3 className="font-bold text-base text-[#111214]">Publication Date</h3>
                <span className="text-[#111214]">
                  {openFilters.date ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
              {openFilters.date && (
                <div className="pt-4 pb-2">
                  <ul className="space-y-2 text-sm mb-4">
                    {["All", "Last Week", "Last Month", "Last 3 Months", "Last 6 Months", "Last 12 Months", "Last 2 Years", "Last 5 Years"].map(d => (
                      <li 
                        key={d}
                        className={`flex justify-between cursor-pointer hover:text-[#111214] ${dateFilter === d ? "font-bold text-[#111214]" : "text-slate-700"}`}
                        onClick={() => setDateFilter(d)}
                      >
                        <span className="text-sm">{d === "All" ? "Any Date" : d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <label htmlFor="cat-date-from" className="font-semibold text-slate-700">From:</label>
                    <input 
                      id="cat-date-from"
                      type="number" 
                      placeholder="1996" 
                      className="w-16 h-8 border border-slate-300/80 rounded-xl px-2 text-xs outline-none focus:border-[#111214] bg-white/80"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                    />
                    <label htmlFor="cat-date-to" className="font-semibold text-slate-700">To:</label>
                    <input 
                      id="cat-date-to"
                      type="number" 
                      placeholder="2026" 
                      className="w-16 h-8 border border-slate-300/80 rounded-xl px-2 text-xs outline-none focus:border-[#111214] bg-white/80"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                    />
                    <AnimatedSweepButton 
                      onClick={() => setDateFilter("Custom")}
                      variant="black"
                      className="h-8 px-3.5 text-xs font-bold rounded-full shadow-sm"
                    >
                      Go
                    </AnimatedSweepButton>
                  </div>
                </div>
              )}
            </div>
            </div>{/* end mobile collapsible */}
          </aside>

          {/* RIGHT CONTENT - RESULTS */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 admin-glass-panel p-3.5 rounded-2xl">
              <span className="text-sm text-slate-700">
                Showing <span className="font-bold text-[#111214]">{startItem}–{endItem}</span> of{" "}
                <span className="font-bold text-[#111214]">{filtered.length}</span> results
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label htmlFor="catalog-page-size" className="font-semibold">Show:</label>
                <select
                  id="catalog-page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Books per page"
                  className="bg-white/80 border border-white rounded-full px-3 py-1.5 text-[#111214] font-bold text-xs focus:outline-none focus:border-[#111214] cursor-pointer transition-colors"
                >
                  <option value={15}>15 per page</option>
                  <option value={30}>30 per page</option>
                  <option value={45}>45 per page</option>
                </select>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentPage + "_" + pageSize}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
                id="catalog-grid"
              >
                {paginatedBooks.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => onNavigate("book-details", b.id)}
                    className="admin-glass-panel group/card flex flex-col p-3 rounded-2xl cursor-pointer hover:border-[#111214]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="w-full aspect-[2/3] rounded-xl mb-3 overflow-hidden shadow-sm">
                      <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
                    </div>
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 text-[#111214] group-hover/card:underline transition-colors" style={fontDisplay}>{b.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 truncate">{b.author}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 truncate" title={b.onlineIsbn ? `eISBN: ${b.onlineIsbn}` : ""}>
                        <span className="font-bold">eISBN:</span> {b.onlineIsbn || "—"}
                      </span>
                      <AnimatedSweepButton 
                        onClick={(e) => { e.stopPropagation(); onNavigate("book-details", b.id); }}
                        variant="card-outline"
                        className="text-[10px] sm:text-xs rounded-full px-2.5 py-1 whitespace-nowrap shrink-0"
                      >
                        View book
                      </AnimatedSweepButton>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full py-20 text-center admin-glass-panel rounded-2xl">
                    <p className="text-[#111214] font-semibold">No titles match the selected filters.</p>
                    <AnimatedSweepButton onClick={resetFilters} variant="yellow" className="mt-4 px-6 py-2 rounded-full font-bold text-sm">Reset Filters</AnimatedSweepButton>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-center gap-3 mt-10 pt-8 border-t border-black/10">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="group/prev h-9 px-4 flex items-center justify-center gap-1.5 rounded-full admin-glass-pill text-[#111214] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                    <span>Prev</span>
                  </button>

                  {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-500 text-xs font-bold select-none">
                          …
                        </span>
                      );
                    }
                    const isActive = currentPage === page;
                    return (
                      <button
                        type="button"
                        key={page}
                        onClick={() => handlePageChange(page)}
                        aria-label={`Page ${page}`}
                        aria-current={isActive ? "page" : undefined}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#111214] text-[#F5F23B] shadow-md scale-105"
                            : "admin-glass-pill text-[#111214] hover:bg-white"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="group/next h-9 px-4 flex items-center justify-center gap-1.5 rounded-full admin-glass-pill text-[#111214] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all duration-200 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  Page <span className="font-bold text-[#111214]">{currentPage}</span> of{" "}
                  <span className="font-bold text-[#111214]">{totalPages}</span> ({filtered.length} total titles)
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CREATED FOR YOU BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="admin-glass-shell rounded-[28px] p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between text-[#111214] relative z-20">
          <div className="md:w-1/3 z-10 mb-8 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-3 uppercase tracking-wide" style={fontDisplay}>Created For You</h2>
            <p className="text-slate-700 text-sm mb-7 leading-relaxed max-w-sm mx-auto md:mx-0">
              Discover titles tailored to your reading history and preferences based on your past activity.
            </p>
            <AnimatedSweepButton 
              onClick={() => {
                document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="yellow"
              className="font-bold px-8 py-3 rounded-full text-sm shadow-sm"
            >
              Explore More
            </AnimatedSweepButton>
          </div>
          
          <div className="md:w-2/3 z-10 w-full min-w-0">
            <AutoMarquee
              items={createdForYouBooks}
              speed={34}
              className="gap-4 px-2 py-2 w-full"
              renderItem={(b, idx) => (
                <div
                  key={`${b.id}-cfy-mq-${idx}`}
                  onClick={() => onNavigate("book-details", b.id)}
                  className="admin-glass-panel flex gap-4 w-60 sm:w-72 flex-shrink-0 p-4 text-[#111214] cursor-pointer hover:shadow-lg rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <BookCover book={b} className="w-20 h-32 rounded-xl flex-shrink-0 shadow-sm" />
                  <div className="flex flex-col flex-1 py-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2" style={fontDisplay}>{b.title}</h3>
                    <p className="text-xs text-slate-600 mb-auto line-clamp-2">{b.author}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 truncate" title={b.onlineIsbn ? `eISBN: ${b.onlineIsbn}` : ""}>
                        <span className="font-bold">eISBN:</span> {b.onlineIsbn || "—"}
                      </span>
                      <span className="text-xs font-bold text-[#111214] flex items-center gap-0.5 shrink-0">
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / INFO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-14 border-t border-black/10 mt-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#111214]" style={fontDisplay}>Why Choose <span className="font-black uppercase text-red-600" style={fontBody}>SpellBound</span> <span className="italic">Publishers & Distributors</span>?</h2>
          <p className="text-slate-700 text-sm mt-2">The premier online library platform for institutions and avid readers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group/benefit relative admin-glass-panel rounded-2xl p-8 text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-2 overflow-hidden cursor-default select-none">
            <div className="w-16 h-16 bg-[#F5F23B] rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-all duration-300 group-hover/benefit:scale-110">
              <ShieldCheck size={30} className="text-[#111214]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#111214]" style={fontDisplay}>Secure Browser Reading</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Every book here is read in-browser only — there's no download, ensuring content protection and easy access everywhere.
            </p>
          </div>

          <div className="group/benefit relative admin-glass-panel rounded-2xl p-8 text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-2 overflow-hidden cursor-default select-none">
            <div className="w-16 h-16 bg-[#F5F23B] rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-all duration-300 group-hover/benefit:scale-110">
              <Library size={30} className="text-[#111214]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#111214]" style={fontDisplay}>Institutional Access</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Tailored specifically for universities and schools. Institutions get a fixed set of titles for licensed terms effortlessly.
            </p>
          </div>

          <div className="group/benefit relative admin-glass-panel rounded-2xl p-8 text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-2 overflow-hidden cursor-default select-none">
            <div className="w-16 h-16 bg-[#F5F23B] rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-all duration-300 group-hover/benefit:scale-110">
              <BookmarkCheck size={30} className="text-[#111214]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#111214]" style={fontDisplay}>Curated Collections</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Access the most meticulously selected books across various genres. Free trial readers get thirty days to explore everything.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="glass-footer-bar text-[#111214] pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-6 border-b border-black/10 pb-8">
            
            {/* Branding Column */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-5 cursor-pointer" onClick={() => onNavigate("catalog")}>
                <img src="/logo.png" alt="SpellBound Logo" className="h-[110px]" />
              </div>
              <div className="text-sm text-slate-700 leading-relaxed space-y-1">
                <p>
                  <span className="font-black text-red-600 uppercase text-2xl tracking-[0.12em]" style={fontBody}>SpellBound</span>
                  <br />
                  <span className="text-[#111214] italic" style={fontDisplay}>Publishers & Distributors</span>
                </p>
                <p>
                  113, Vivekananda Rd, Manicktala,<br />
                  Azad Hind Bag, Kolkata,<br />
                  West Bengal 700006
                </p>
                <p>
                  Phone: 6289998227<br />
                  Email: spellboudpd@gmail.com<br />
                  Web: www.spellboudpd.in
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#111214] font-bold mb-5 tracking-wider text-xs uppercase">Quick Links</h4>
              <ul className="space-y-3 text-sm text-slate-700">
                <li><button type="button" onClick={() => { onNavigate("catalog"); window.scrollTo(0,0); }} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Home</button></li>
                <li><button type="button" onClick={() => onNavigate("page:about-us")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">About Us</button></li>
                <li><button type="button" onClick={() => onNavigate("page:contact-us")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Contact Us</button></li>
                <li><button type="button" onClick={() => { onNavigate("catalog"); setTimeout(() => document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Categories</button></li>
                <li><button type="button" onClick={() => onNavigate("login-reader")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Login / Sign In</button></li>
              </ul>
            </div>

            {/* Customer Area */}
            <div>
              <h4 className="text-[#111214] font-bold mb-5 tracking-wider text-xs uppercase">Customer Area</h4>
              <ul className="space-y-3 text-sm text-slate-700">
                <li><button type="button" onClick={() => onNavigate("page:terms")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Terms</button></li>
                <li><button type="button" onClick={() => onNavigate("page:privacy-policy")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button type="button" onClick={() => onNavigate("page:faqs")} className="hover:text-[#111214] font-medium transition-colors cursor-pointer">FAQs</button></li>
              </ul>
            </div>

            {/* Location Map */}
            <div className="col-span-1 lg:col-span-1">
              <h4 className="text-[#111214] font-bold mb-5 tracking-wider text-xs uppercase">Our Location</h4>
              <div className="rounded-2xl overflow-hidden border border-white opacity-90 hover:opacity-100 transition-opacity relative group shadow-sm">
                <a 
                  href="https://maps.app.goo.gl/Jc5SNuV5v7ErsFGw5" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="absolute inset-0 z-10 block"
                  title="Open in Google Maps"
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <div className="bg-[#111214] text-[#F5F23B] px-4 py-2 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View on Map ↗
                    </div>
                  </div>
                </a>
                <iframe 
                  src="https://maps.google.com/maps?q=Spellbound+Publishers+and+Distributors,+Kolkata&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="180" 
                  style={{ border: 0, pointerEvents: 'none' }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SpellBound Location"
                ></iframe>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-[#111214] font-bold mb-5 tracking-wider text-xs uppercase">Don't Miss Updates</h4>
              <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                Subscribe to our newsletter to get the newest book updates directly in your inbox.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }}
                className="flex flex-col gap-2.5"
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" size={16} />
                  <input 
                    id="newsletter-email"
                    type="email" 
                    aria-label="Newsletter email address"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Type your email here..." 
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    className="glass-field-control pl-10"
                  />
                </div>
                <AnimatedSweepButton 
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  variant="yellow"
                  className="font-bold py-2.5 rounded-full text-sm w-full"
                >
                  {subscribeStatus === 'loading' ? 'Subscribing...' : subscribeStatus === 'success' ? 'Subscribed! ✓' : 'Subscribe'}
                </AnimatedSweepButton>
                {subscribeStatus === 'error' && <span role="alert" className="text-rose-600 text-xs font-medium">Please enter a valid email.</span>}
              </form>
            </div>
            
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-black gap-4">
            <p>© {new Date().getFullYear()} <strong className="uppercase text-red-600" style={fontBody}>SpellBound</strong> <i style={fontDisplay}>Publishers & Distributors</i>. All Rights Reserved.</p>
            <div className="flex gap-4">
              <button onClick={() => onNavigate("page:privacy-policy")} className="hover:text-black transition-colors">Privacy Policy</button>
              <button onClick={() => onNavigate("page:terms")} className="hover:text-black transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
