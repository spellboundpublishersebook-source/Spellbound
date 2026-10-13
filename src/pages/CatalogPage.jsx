import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { 
  Search, ShieldCheck, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ShoppingCart, BookOpen, Users, Star, Mail, 
  Library, BookmarkCheck 
} from "lucide-react";
import { fontDisplay, fontBody, getHomepageConfig } from "../theme";
import AnimatedSweepButton from "../components/AnimatedSweepButton";

// Helper for book covers since we only have colors
const BookCover = ({ book, className = "" }) => {
  const hasCover = book.coverUrl && book.coverUrl !== "null" && book.coverUrl !== "undefined" && book.coverUrl.trim() !== "";
  return (
    <div 
      className={`relative flex flex-col items-center justify-center p-3 text-center overflow-hidden shadow-md bg-[length:100%_100%] bg-center bg-no-repeat ${className}`} 
      style={{ backgroundColor: hasCover ? 'transparent' : book.color, backgroundImage: hasCover ? `url(${book.coverUrl})` : 'none' }}
    >
      {!hasCover && (
        <>
          <h3 className="text-black font-bold leading-tight z-10 text-sm" style={{ ...fontDisplay, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{book.title}</h3>
          <p className="text-black/80 text-xs mt-2 z-10">{book.author}</p>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
        </>
      )}
    </div>
  );
};

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
  const [pageSize, setPageSize] = useState(10);

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

  const resumeBookId = localStorage.getItem("last_read_book");
  const resumeBook = useMemo(() => books.find(b => b.id === resumeBookId), [books, resumeBookId]);

  const [trendingIndex, setTrendingIndex] = useState(0);

  const trendingPool = useMemo(() => {
    if (homepageConfig.trendingMode === 'manual') {
      return homepageConfig.trendingBookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
    }
    return books.slice(0, 8);
  }, [books, homepageConfig]);

  const visibleTrending = useMemo(() => {
    if (trendingPool.length === 0) return [];
    if (trendingPool.length <= 3) {
      // Pad if less than 3 so the layout doesn't break? Or just return what we have.
      // Better to return what we have, but if they want exactly 3, padding might be needed if they have less than 3 books.
      // But assuming they have at least 3 books.
      return trendingPool;
    }
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(trendingPool[(trendingIndex + i) % trendingPool.length]);
    }
    return items;
  }, [trendingPool, trendingIndex]);

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
    <div className="bg-[#f8f9fa] min-h-screen text-[#131313] w-full" style={fontBody}>
      
      {/* HERO SECTION */}
      <section className="bg-[#F9FAFB] text-black py-8 sm:py-12 md:py-20 px-4 sm:px-6 relative z-30 overflow-visible w-full max-w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-center relative z-30">
          
          <div className="lg:w-1/2 z-30 w-full relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight uppercase" style={fontDisplay}>
              Start Your Reading <span className="text-[#FDD132]">Adventure</span> Invest In Books Today
            </h1>
            <p className="mt-4 sm:mt-6 text-sm md:text-base text-black max-w-lg leading-relaxed">
              Every title in the catalog, open to browse. Anyone can look through the full list below. 
              Reading a book requires an account — issued to your institution, or a free 30-day trial you can request yourself.
            </p>
            
            <div className="mt-6 sm:mt-8 relative max-w-lg w-full z-40" ref={searchContainerRef}>
              <div className="flex items-center bg-white rounded-md p-1.5 w-full relative z-20 shadow-sm border border-gray-200">
                <Search size={20} className="ml-3 text-black flex-shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search book here..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 sm:py-3 text-black w-full text-sm"
                />
                <AnimatedSweepButton 
                  onClick={() => {
                    setIsSearchOpen(false);
                    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  variant="yellow"
                  className="font-semibold px-5 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm flex-shrink-0"
                >
                  Search
                </AnimatedSweepButton>
              </div>

              {/* Live Search Dropdown */}
              {isSearchOpen && query.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-2xl z-50 max-h-80 overflow-y-auto border border-gray-200">
                  {filtered.length > 0 ? (
                    <ul className="py-2 divide-y divide-gray-100">
                      {filtered.slice(0, 10).map((b) => (
                        <li 
                          key={b.id} 
                          onClick={() => {
                            setIsSearchOpen(false);
                            setQuery("");
                            onNavigate("book-details", b.id);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-4 transition-colors"
                        >
                          <BookCover book={b} className="w-10 h-14 flex-shrink-0 text-[10px] rounded shadow-sm" />
                          <div className="flex-1 min-w-0 pt-1">
                            <h4 className="text-black font-bold truncate text-sm">{b.title}</h4>
                            <p className="text-gray-600 text-xs truncate">{b.author}</p>
                            <p className="text-gray-500 text-[10px] mt-1 uppercase font-semibold">{b.genre}</p>
                          </div>
                          <div className="flex-shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            View Access
                          </div>
                        </li>
                      ))}
                      {filtered.length > 10 && (
                        <li 
                          className="px-4 py-3 text-center text-sm font-semibold text-black hover:bg-gray-100 cursor-pointer bg-gray-50"
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
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No books found matching "{query}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 sm:mt-8 flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
              <AnimatedSweepButton 
                onClick={() => onNavigate("trial")}
                variant="outline"
                className="text-xs sm:text-sm rounded px-4 py-2"
              >
                Request free trial
              </AnimatedSweepButton>
              <AnimatedSweepButton 
                onClick={() => onNavigate("login-reader")}
                variant="outline"
                className="text-xs sm:text-sm rounded px-4 py-2"
              >
                Institution login
              </AnimatedSweepButton>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col items-center z-10 w-full max-w-full mt-6 lg:mt-0 overflow-hidden">
            <h2 className="text-2xl mb-6 sm:mb-8 font-semibold self-center lg:self-start ml-0 lg:ml-12" style={fontDisplay}>Trending Now</h2>
            <div className="flex gap-2 sm:gap-4 md:gap-6 items-center justify-center min-h-[200px] sm:min-h-[300px] py-4 max-w-full">
              {visibleTrending.map((b, i) => {
                const isCenter = i === 1 && visibleTrending.length >= 3;
                return (
                  <div 
                    key={`${b.id}-${i}`}
                    onClick={() => onNavigate("book-details", b.id)}
                    className={`group/trending relative cursor-pointer select-none transition-all duration-300 ease-out [will-change:transform,box-shadow]
                      hover:-translate-y-4 hover:z-30
                      ${isCenter 
                        ? 'scale-110 z-20 hover:scale-[1.18]' 
                        : 'scale-100 z-10 hover:scale-108'
                      }`}
                  >
                    {/* Glowing highlight border & deep 3D elevation container */}
                    <div className="relative rounded-md overflow-hidden transition-all duration-300 ease-out group-hover/trending:shadow-[0_28px_50px_-12px_rgba(0,0,0,0.55),0_12px_24px_-6px_rgba(0,0,0,0.35)] group-hover/trending:ring-2 group-hover/trending:ring-[#FDD132] group-hover/trending:ring-offset-2 group-hover/trending:ring-offset-white">
                      <BookCover 
                        book={b} 
                        className="w-20 h-28 sm:w-28 sm:h-42 md:w-44 md:h-64 rounded-md shadow-2xl transition-transform duration-300 ease-out group-hover/trending:scale-105" 
                      />
                      {/* Deep interactive feedback sheen with View Book pill */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover/trending:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 pointer-events-none">
                        <span className="bg-black/90 text-[#FDD132] text-xs font-bold px-3 py-1 rounded-full border border-[#FDD132]/70 shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover/trending:translate-y-0 transition-transform duration-300">
                          <BookOpen size={12} className="text-[#FDD132]" /> View Book
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {trendingPool.length > 3 && (
              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setTrendingIndex(prev => (prev - 1 + trendingPool.length) % trendingPool.length)}
                  aria-label="Previous trending title"
                  className="p-2.5 border border-gray-400 bg-white/80 hover:bg-[#FDD132] hover:border-[#FDD132] text-black rounded-full hover:scale-110 active:scale-95 shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setTrendingIndex(prev => (prev + 1) % trendingPool.length)}
                  aria-label="Next trending title"
                  className="p-2.5 border border-gray-400 bg-white/80 hover:bg-[#FDD132] hover:border-[#FDD132] text-black rounded-full hover:scale-110 active:scale-95 shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
          
          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, #FDD132 0%, transparent 50%)' }}>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-[#FDD132] text-black py-4 relative z-10">
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

      {resumeBook && (
        <section className="max-w-7xl mx-auto px-6 pt-10">
          <div className="bg-white border border-[#FDD132] rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <BookCover book={resumeBook} className="w-16 h-24 rounded" />
              <div>
                <h3 className="font-bold text-sm text-black uppercase tracking-wider mb-1">Pick up where you left off</h3>
                <h2 className="text-xl font-bold" style={fontDisplay}>{resumeBook.title}</h2>
                <p className="text-sm text-black mt-1">by {resumeBook.author}</p>
              </div>
            </div>
            <AnimatedSweepButton 
              onClick={() => onNavigate("book-details", resumeBook.id)}
              variant="yellow"
              className="font-bold px-6 py-3 rounded text-sm w-full md:w-auto"
            >
              Continue Reading
            </AnimatedSweepButton>
          </div>
        </section>
      )}

      {/* NEW RELEASES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-gray-200 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={fontDisplay}>New Releases</h2>
            <p className="text-sm text-black mt-2">What's new? Browse latest titles in the new releases category to discover your next read!</p>
          </div>
          <button 
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-black px-3.5 py-1.5 rounded-full border border-transparent hover:border-[#FDD132] hover:bg-[#FDD132]/10 hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
            onClick={() => {
              setDateFilter("Last 3 Months");
              document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>View all</span>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-black transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newReleases.map(b => (
            <div 
              key={b.id} 
              onClick={() => onNavigate("book-details", b.id)}
              className="book-card group/card p-4 flex gap-4"
            >
              <div className="w-24 h-36 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-bold text-sm leading-tight mb-1 group-hover/card:underline transition-colors" style={fontDisplay}>{b.title}</h3>
                <p className="text-xs text-black mb-2">{b.author}</p>
                <div className="mt-auto">
                  <div className="font-bold text-sm mb-3">₹{b.price}.00</div>
                  <AnimatedSweepButton 
                    onClick={(e) => { e.stopPropagation(); onNavigate("book-details", b.id); }}
                    variant="card-subtle"
                    className="text-xs px-3 py-2 rounded w-full justify-center"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-gray-200 pb-4 gap-4">
          <h2 className="text-2xl font-bold" style={fontDisplay}>Featured Authors</h2>
          <button 
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-black px-3.5 py-1.5 rounded-full border border-transparent hover:border-[#FDD132] hover:bg-[#FDD132]/10 hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
            onClick={() => onNavigate("authors")}
          >
            <span>View all authors</span>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-black transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-8 md:gap-12 justify-center md:justify-start py-4">
          {topAuthors.map((authorRaw, idx) => {
            const author = String(authorRaw || "");
            const words = author.split(/[\s,-]+/).filter(Boolean);
            const initials = words.length > 1 
              ? (words[0][0] + words[1][0]).toUpperCase() 
              : (words[0] ? words[0][0].toUpperCase() : '');
              
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center group/author cursor-pointer max-w-[140px] select-none transition-all duration-300 ease-out hover:-translate-y-2.5 active:scale-95"
                onClick={() => {
                  setSelectedAuthor(author);
                  document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-300 group-hover/author:from-[#FDD132] group-hover/author:via-amber-200 group-hover/author:to-yellow-300 flex items-center justify-center text-2xl font-bold text-black mb-3 border-4 border-white shadow-md group-hover/author:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)] ring-2 ring-transparent group-hover/author:ring-[#FDD132] group-hover/author:ring-offset-2 transition-all duration-300 ease-out transform group-hover/author:scale-108">
                  <span className="transform transition-transform duration-300 group-hover/author:scale-110">
                    {initials}
                  </span>
                </div>
                <p className="font-semibold text-sm text-center text-gray-800 group-hover/author:text-black group-hover/author:font-bold transition-all duration-200 line-clamp-2">
                  {author}
                </p>
                <span className="text-[11px] font-bold text-amber-700 opacity-0 group-hover/author:opacity-100 transition-opacity duration-200 mt-0.5">
                  View titles →
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATALOG SECTION WITH SIDEBAR */}
      <section id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-gray-200 pb-4 gap-4">
          <h2 className="text-2xl font-bold" style={fontDisplay}>Browse Catalog</h2>
          <button 
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-black px-3.5 py-1.5 rounded-full border border-transparent hover:border-[#FDD132] hover:bg-[#FDD132]/15 hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
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
            <ChevronRight size={16} className="text-gray-500 group-hover:text-black transform transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className="lg:w-1/4 flex-shrink-0">
            {/* Mobile filter toggle */}
            <button
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 font-bold text-sm text-black"
              onClick={() => setMobileFiltersOpen(o => !o)}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filters
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: mobileFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="mb-4 text-sm font-bold text-black uppercase tracking-wider flex justify-between items-center">
              Filters
            </div>
            <p className="text-xs text-black mb-6 pb-4 border-b border-gray-200">
              Selecting a filter will automatically update the results below. All data is populated dynamically and can be updated via the admin/uploader panel.
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
            <div className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer border-2 border-blue-600 p-3 rounded"
                onClick={() => toggleFilter('date')}
              >
                <h3 className="font-bold text-base text-black">Publication Date</h3>
                <span className="text-black">
                  {openFilters.date ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-blue-600" />}
                </span>
              </div>
              {openFilters.date && (
                <div className="pt-4 pb-4 border-b border-gray-200">
                  <ul className="space-y-2 text-sm mb-4">
                    {["All", "Last Week", "Last Month", "Last 3 Months", "Last 6 Months", "Last 12 Months", "Last 2 Years", "Last 5 Years"].map(d => (
                      <li 
                        key={d}
                        className={`flex justify-between cursor-pointer hover:text-[#FDD132] ${dateFilter === d ? "font-bold text-black" : "text-black"}`}
                        onClick={() => setDateFilter(d)}
                      >
                        <span className="text-sm">{d === "All" ? "Any Date" : d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-black">From:</span>
                    <input 
                      type="number" 
                      placeholder="1996" 
                      className="w-16 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                    />
                    <span className="font-semibold text-black ml-2">To:</span>
                    <input 
                      type="number" 
                      placeholder="2026" 
                      className="w-16 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                    />
                    <button 
                      className="bg-[#0a3875] text-black px-3 py-1 font-bold text-xs rounded hover:bg-blue-900 ml-1"
                      onClick={() => setDateFilter("Custom")}
                    >
                      Go
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>{/* end mobile collapsible */}
          </div>

          {/* RIGHT CONTENT - RESULTS */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-700">
                Showing <span className="font-bold text-black">{startItem}–{endItem}</span> of{" "}
                <span className="font-bold text-black">{filtered.length}</span> results
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Books per page"
                  className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-black font-semibold text-xs focus:outline-none focus:border-black cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {paginatedBooks.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => onNavigate("book-details", b.id)}
                  className="book-card group/card flex flex-col p-3 bg-white border border-black rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="w-full aspect-[2/3] rounded-md mb-4 overflow-hidden shadow-sm">
                    <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
                  </div>
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover/card:underline transition-colors" style={fontDisplay}>{b.title}</h3>
                  <p className="text-xs text-black mt-1 truncate">{b.author}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-sm">₹{b.price}.00</span>
                    <AnimatedSweepButton 
                      onClick={(e) => { e.stopPropagation(); onNavigate("book-details", b.id); }}
                      variant="card-outline"
                      className="text-[10px] sm:text-xs rounded px-2.5 py-1 whitespace-nowrap"
                    >
                      View book
                    </AnimatedSweepButton>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-black">No titles match the selected filters.</p>
                  <AnimatedSweepButton onClick={resetFilters} variant="yellow" className="mt-4 px-6 py-2 rounded-md font-bold text-sm">Reset Filters</AnimatedSweepButton>
                </div>
              )}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                <span className="text-xs text-gray-500 order-2 sm:order-1">
                  Page <span className="font-semibold text-black">{currentPage}</span> of{" "}
                  <span className="font-semibold text-black">{totalPages}</span>
                </span>

                <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="h-9 px-3 flex items-center justify-center gap-1 rounded-md border border-gray-300 text-black text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-8 h-9 flex items-center justify-center text-gray-400 text-xs">
                          …
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`min-w-9 h-9 px-2.5 flex items-center justify-center rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? "bg-black text-white shadow-sm"
                            : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="h-9 px-3 flex items-center justify-center gap-1 rounded-md border border-gray-300 text-black text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CREATED FOR YOU BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-gray-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-black relative z-20 shadow-xl">
          <div className="md:w-1/3 z-10 mb-10 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-wide" style={fontDisplay}>Created For You</h2>
            <p className="text-black text-sm mb-8 leading-relaxed max-w-sm mx-auto md:mx-0">
              Discover titles tailored to your reading history and preferences based on your past activity.
            </p>
            <AnimatedSweepButton 
              onClick={() => {
                document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="yellow"
              className="font-bold px-8 py-3 rounded-md text-sm shadow-sm"
            >
              Explore More
            </AnimatedSweepButton>
          </div>
          
          <div className="md:w-2/3 flex gap-4 items-center justify-center z-10 w-full overflow-x-auto pb-4 md:pb-0">
            <button className="p-2 bg-white text-black rounded-full hover:bg-gray-100 flex-shrink-0 transition-transform hover:scale-105">
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-4 px-2">
              {createdForYouBooks.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => onNavigate("book-details", b.id)}
                  className="book-card flex gap-4 w-60 sm:w-72 flex-shrink-0 p-4 text-black"
                >
                   <BookCover book={b} className="w-20 h-32 rounded flex-shrink-0" />
                   <div className="flex flex-col flex-1 py-1">
                     <h3 className="font-bold text-sm leading-tight mb-2" style={fontDisplay}>{b.title}</h3>
                     <p className="text-xs text-black mb-auto line-clamp-2">{b.author}</p>
                     <div className="font-bold text-sm mt-2 flex items-center justify-between">
                       <span>₹{b.price}.00</span>
                       <button className="text-black hover:text-black">
                         <ChevronRight size={16} />
                       </button>
                     </div>
                   </div>
                </div>
              ))}
            </div>
            <button className="p-2 bg-white text-black rounded-full hover:bg-gray-100 flex-shrink-0 transition-transform hover:scale-105">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / INFO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-200 mt-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold" style={fontDisplay}>Why Choose <span className="font-black uppercase text-red-600" style={fontBody}>SpellBound</span> <span className="italic">Publishers & Distributors</span>?</h2>
          <p className="text-black text-sm mt-2">The premier online library platform for institutions and avid readers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group/benefit relative bg-white rounded-xl p-8 border border-gray-200 hover:border-[#FDD132] text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-3 shadow-sm hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.14),0_8px_20px_-6px_rgba(0,0,0,0.08)] overflow-hidden cursor-default select-none">
            {/* Golden top accent bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FDD132] transform scale-x-0 group-hover/benefit:scale-x-100 transition-transform duration-300 ease-out origin-center" />
            <div className="w-16 h-16 bg-[#fff9db] group-hover/benefit:bg-[#FDD132] rounded-full flex items-center justify-center mb-5 transition-all duration-300 ease-out group-hover/benefit:scale-110 group-hover/benefit:shadow-md">
              <ShieldCheck size={32} className="text-[#B8860B] group-hover/benefit:text-black transition-all duration-300 group-hover/benefit:rotate-6" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-black transition-colors" style={fontDisplay}>Secure Browser Reading</h3>
            <p className="text-sm text-gray-700 group-hover/benefit:text-black leading-relaxed transition-colors">
              Every book here is read in-browser only — there's no download, ensuring content protection and easy access everywhere.
            </p>
          </div>

          <div className="group/benefit relative bg-white rounded-xl p-8 border border-gray-200 hover:border-[#FDD132] text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-3 shadow-sm hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.14),0_8px_20px_-6px_rgba(0,0,0,0.08)] overflow-hidden cursor-default select-none">
            {/* Golden top accent bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FDD132] transform scale-x-0 group-hover/benefit:scale-x-100 transition-transform duration-300 ease-out origin-center" />
            <div className="w-16 h-16 bg-[#fff9db] group-hover/benefit:bg-[#FDD132] rounded-full flex items-center justify-center mb-5 transition-all duration-300 ease-out group-hover/benefit:scale-110 group-hover/benefit:shadow-md">
              <Library size={32} className="text-[#B8860B] group-hover/benefit:text-black transition-all duration-300 group-hover/benefit:rotate-6" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-black transition-colors" style={fontDisplay}>Institutional Access</h3>
            <p className="text-sm text-gray-700 group-hover/benefit:text-black leading-relaxed transition-colors">
              Tailored specifically for universities and schools. Institutions get a fixed set of titles for licensed terms effortlessly.
            </p>
          </div>

          <div className="group/benefit relative bg-white rounded-xl p-8 border border-gray-200 hover:border-[#FDD132] text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-3 shadow-sm hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.14),0_8px_20px_-6px_rgba(0,0,0,0.08)] overflow-hidden cursor-default select-none">
            {/* Golden top accent bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FDD132] transform scale-x-0 group-hover/benefit:scale-x-100 transition-transform duration-300 ease-out origin-center" />
            <div className="w-16 h-16 bg-[#fff9db] group-hover/benefit:bg-[#FDD132] rounded-full flex items-center justify-center mb-5 transition-all duration-300 ease-out group-hover/benefit:scale-110 group-hover/benefit:shadow-md">
              <BookmarkCheck size={32} className="text-[#B8860B] group-hover/benefit:text-black transition-all duration-300 group-hover/benefit:rotate-6" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-black transition-colors" style={fontDisplay}>Curated Collections</h3>
            <p className="text-sm text-gray-700 group-hover/benefit:text-black leading-relaxed transition-colors">
              Access the most meticulously selected books across various genres. Free trial readers get thirty days to explore everything.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 text-black pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-4 border-b border-gray-100 pb-4">
            
            {/* Branding Column */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => onNavigate("catalog")}>
                <img src="/logo.png" alt="SpellBound Logo" className="h-[120px]" />
              </div>
              <div className="text-sm text-black leading-relaxed mb-6 space-y-1">
                <p>
                  <span className="font-black text-red-600 uppercase text-2xl tracking-[0.12em]" style={fontBody}>SpellBound</span>
                  <br />
                  <span className="text-black italic" style={fontDisplay}>Publishers & Distributors</span>
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
              <h4 className="text-black font-bold mb-6 tracking-wider text-sm uppercase">Quick Links</h4>
              <ul className="space-y-3 text-sm text-black">
                <li><button onClick={() => { onNavigate("catalog"); window.scrollTo(0,0); }} className="hover:text-[#FDD132] transition-colors">Home</button></li>
                <li><button onClick={() => onNavigate("page:about-us")} className="hover:text-[#FDD132] transition-colors">About Us</button></li>
                <li><button onClick={() => onNavigate("page:contact-us")} className="hover:text-[#FDD132] transition-colors">Contact Us</button></li>
                <li><button onClick={() => { onNavigate("catalog"); setTimeout(() => document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="hover:text-[#FDD132] transition-colors">Categories</button></li>
                <li><button onClick={() => onNavigate("login-reader")} className="hover:text-[#FDD132] transition-colors">Login / Sign In</button></li>
              </ul>
            </div>

            {/* Customer Area */}
            <div>
              <h4 className="text-black font-bold mb-6 tracking-wider text-sm uppercase">Customer Area</h4>
              <ul className="space-y-3 text-sm text-black">
                <li><button onClick={() => onNavigate("page:terms")} className="hover:text-[#FDD132] transition-colors">Terms</button></li>
                <li><button onClick={() => onNavigate("page:privacy-policy")} className="hover:text-[#FDD132] transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate("page:faqs")} className="hover:text-[#FDD132] transition-colors">FAQs</button></li>
              </ul>
            </div>

            {/* Location Map */}
            <div className="col-span-1 lg:col-span-1">
              <h4 className="text-black font-bold mb-6 tracking-wider text-sm uppercase">Our Location</h4>
              <div className="rounded-lg overflow-hidden border border-gray-200 opacity-80 hover:opacity-100 transition-opacity relative group">
                <a 
                  href="https://maps.app.goo.gl/Jc5SNuV5v7ErsFGw5" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="absolute inset-0 z-10 block"
                  title="Open in Google Maps"
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-white text-[#FDD132] px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
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
              <h4 className="text-black font-bold mb-6 tracking-wider text-sm uppercase">Don't Miss Updates</h4>
              <p className="text-sm text-black mb-4 leading-relaxed">
                Subscribe to our newsletter to get the newest book updates and special offers directly in your inbox.
              </p>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-black" size={16} />
                  <input 
                    type="email" 
                    placeholder="Type your email here..." 
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    className="w-full bg-gray-50 border border-gray-300 text-black rounded px-10 py-2.5 text-sm focus:outline-none focus:border-[#FDD132]"
                  />
                </div>
                <AnimatedSweepButton 
                  onClick={handleSubscribe} 
                  disabled={subscribeStatus === 'loading'}
                  variant="yellow"
                  className="font-bold py-2.5 rounded text-sm w-full"
                >
                  {subscribeStatus === 'loading' ? 'Subscribing...' : subscribeStatus === 'success' ? 'Subscribed! ✓' : 'Subscribe'}
                </AnimatedSweepButton>
                {subscribeStatus === 'error' && <span className="text-red-400 text-xs">Please enter a valid email.</span>}
              </div>
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
