import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Clock, AlertTriangle, BookOpen, ChevronRight, ChevronLeft, X, 
  User, Mail, Building2, ArrowUpDown, LayoutGrid, List, Check 
} from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { daysUntil } from "../data/mockData";

// Wiley-Style Animated Details Button with Loading Sweep Effect
function WileyDetailsButton({ onClick, className = "", fullWidth = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group/btn inline-flex items-center justify-center text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer border border-black hover:border-[#4D8BDB] hover:ring-2 hover:ring-[#4D8BDB] focus:outline-none focus:border-[#4D8BDB] focus:ring-2 focus:ring-[#4D8BDB] rounded-[2px] bg-white text-black hover:text-white shadow-sm ${
        fullWidth ? "w-full h-[32px] py-1.5 px-3" : "w-[120px] h-[32px] py-1.5 px-4"
      } ${className}`}
    >
      {/* Loading sweep fill from left to right */}
      <span className="absolute inset-0 overflow-hidden rounded-[2px] pointer-events-none">
        <span className="absolute inset-0 bg-black -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out origin-left pointer-events-none" />
      </span>
      {/* Text label */}
      <span className="relative z-10 select-none">
        Details
      </span>
    </button>
  );
}

// Carousel row for the multi-category dashboard view
function CategoryCarouselRow({ genre, books, onOpenBook, onSelectGenre }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons, { passive: true });
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        el.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [books]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -420 : 420;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
      setTimeout(updateScrollButtons, 350);
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <div className="mb-14 relative">
      {/* Category Header */}
      <div className="pb-3 mb-6 border-b border-gray-200">
        <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight" style={fontDisplay}>
          {genre}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Previous books"
            className="absolute -left-4 top-1/3 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {books.map((b) => (
            <div
              key={b.id}
              className="w-[185px] sm:w-[200px] flex-shrink-0 flex flex-col bg-white"
            >
              {/* Cover */}
              <div
                onClick={() => onOpenBook(b.id)}
                className="w-full aspect-[1/1.4] rounded bg-white shadow-sm border border-gray-200 overflow-hidden relative mb-3 cursor-pointer group/card"
              >
                <div
                  className="w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat transition-transform duration-300 group-hover/card:scale-105"
                  style={{
                    backgroundColor: b.color || "#f3f4f6",
                    backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : "none"
                  }}
                />
              </div>

              {/* Badges / Type */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1">
                <span>{b.pubType?.toUpperCase() || "EBOOK"}</span>
                <BookOpen size={13} className="text-gray-700" />
              </div>

              {/* Title */}
              <h4
                onClick={() => onOpenBook(b.id)}
                className="text-sm font-bold text-black leading-snug line-clamp-2 min-h-[2.5rem] mb-1 cursor-pointer hover:underline"
                title={b.title}
                style={fontDisplay}
              >
                {b.title}
              </h4>

              {/* Author */}
              <p className="text-xs text-gray-600 truncate mb-1" title={b.author}>
                by {b.author || "Unknown"}
              </p>

              {/* Edition */}
              <p className="text-xs text-black font-medium mb-3">
                Edition : 1
              </p>

              {/* Details Button with Wiley Loading Sweep Animation */}
              <div className="w-full mt-auto pt-1">
                <WileyDetailsButton
                  onClick={() => onOpenBook(b.id)}
                  fullWidth
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Next books"
            className="absolute -right-4 top-1/3 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* View All Button below the row on the right */}
      <div className="flex justify-end mt-4 pr-1">
        <button
          onClick={() => onSelectGenre(genre)}
          className="flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-600 transition-colors pl-3 border-l-2 border-black cursor-pointer"
        >
          View All
        </button>
      </div>
    </div>
  );
}

export default function ReaderDashboard({ session, books, onOpenBook }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  
  // Type filters
  const [typeFilter, setTypeFilter] = useState(true); // eBook
  const [collectionFilter, setCollectionFilter] = useState(false);
  const [tokenFilter, setTokenFilter] = useState(false);

  // Sorting and Display Modes
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("title-asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDesc, setExpandedDesc] = useState({});

  const pageSize = 12;

  const toggleDesc = (id) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sortOptions = [
    { id: "title-asc", label: "A - Z by title" },
    { id: "title-desc", label: "Z - A by title" },
    { id: "author-asc", label: "A - Z by author" },
    { id: "author-desc", label: "Z - A by author" },
    { id: "date-desc", label: "Latest - oldest by published date" },
    { id: "date-asc", label: "Oldest - latest by published date" },
  ];

  const myBooksRaw = useMemo(() => {
    return session.bookIds === "all"
      ? books
      : books.filter((b) => (Array.isArray(session.bookIds) ? session.bookIds : []).includes(b.id));
  }, [books, session.bookIds]);

  const yearCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach((b) => {
      const y = b.firstPublish ? b.firstPublish.toString().match(/\b(19\d{2}|20\d{2})\b/)?.[0] : null;
      if (y) counts[y] = (counts[y] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);

  const allYearsList = useMemo(() => {
    return Object.keys(yearCounts).sort((a, b) => b - a);
  }, [yearCounts]);

  const genreCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach((b) => {
      if (b.genre) counts[b.genre] = (counts[b.genre] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);

  const authorCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach((b) => {
      if (b.author) counts[b.author] = (counts[b.author] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);

  const allGenres = useMemo(() => {
    return Array.from(new Set(myBooksRaw.map((b) => b.genre).filter(Boolean))).sort();
  }, [myBooksRaw]);

  const allAuthorsList = useMemo(() => {
    return Array.from(new Set(myBooksRaw.map((b) => b.author).filter(Boolean))).sort();
  }, [myBooksRaw]);

  // Check if any specific filter is active
  const isFilteredView = useMemo(() => {
    return selectedGenres.length > 0 || selectedAuthors.length > 0 || selectedYears.length > 0 || tokenFilter || collectionFilter;
  }, [selectedGenres, selectedAuthors, selectedYears, tokenFilter, collectionFilter]);

  // Filtered books
  const myBooks = useMemo(() => {
    return myBooksRaw.filter((b) => {
      const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      const matchesA = selectedAuthors.length === 0 || selectedAuthors.includes(b.author);
      const bookYear = b.firstPublish ? b.firstPublish.toString().match(/\b(19\d{2}|20\d{2})\b/)?.[0] : null;
      const matchesY = selectedYears.length === 0 || (bookYear && selectedYears.includes(bookYear));
      return matchesG && matchesA && matchesY;
    });
  }, [myBooksRaw, selectedGenres, selectedAuthors, selectedYears]);

  // Sorted books
  const sortedBooks = useMemo(() => {
    const list = [...myBooks];
    switch (sortBy) {
      case "title-asc":
        return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "title-desc":
        return list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
      case "author-asc":
        return list.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
      case "author-desc":
        return list.sort((a, b) => (b.author || "").localeCompare(a.author || ""));
      case "date-desc":
        return list.sort((a, b) => (b.firstPublish || "").localeCompare(a.firstPublish || ""));
      case "date-asc":
        return list.sort((a, b) => (a.firstPublish || "").localeCompare(b.firstPublish || ""));
      default:
        return list;
    }
  }, [myBooks, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenres, selectedAuthors, selectedYears, sortBy, viewMode]);

  const totalPages = Math.ceil(sortedBooks.length / pageSize) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBooks.slice(start, start + pageSize);
  }, [sortedBooks, currentPage, pageSize]);

  const displayedCategories = useMemo(() => {
    const genresWithBooks = Array.from(new Set(myBooks.map((b) => b.genre).filter(Boolean))).sort();
    return genresWithBooks.length > 0 ? genresWithBooks : ["All Titles"];
  }, [myBooks]);

  const daysLeft = daysUntil(session.endDate);
  const expiringSoon = daysLeft <= 15 && daysLeft > 0;
  const expired = daysLeft < 0;

  const curatedBooks = useMemo(() => {
    return [...myBooksRaw].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [myBooksRaw]);

  const [curatedIndex, setCuratedIndex] = useState(0);

  const handleClearAll = () => {
    setSelectedGenres([]);
    setSelectedAuthors([]);
    setSelectedYears([]);
    setTypeFilter(true);
    setCollectionFilter(false);
    setTokenFilter(false);
    setCurrentPage(1);
  };

  const startItem = sortedBooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, sortedBooks.length);

  return (
    <div className="bg-white min-h-screen text-[#131313]" style={fontBody}>
      {/* Header */}
      <div className="bg-white text-black border-b border-gray-200 pt-8 pb-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="inline-block px-3 py-1 bg-gray-100 text-black rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-gray-200">
                Reader Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={fontDisplay}>
                {session.name}'s Library
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 mt-4 text-sm text-black bg-gray-50 border border-gray-200 py-3 px-4 rounded-lg inline-flex">
                <span className="flex items-center gap-1.5"><User size={16} className="text-black" /> <span className="font-semibold text-black">ID:</span> {session.id}</span>
                {session.email && (
                  <span className="flex items-center gap-1.5"><Mail size={16} className="text-black" /> <span className="font-semibold text-black">Email:</span> {session.email}</span>
                )}
                {session.institution && session.institution !== session.name && (
                  <span className="flex items-center gap-1.5"><Building2 size={16} className="text-black" /> <span className="font-semibold text-black">Institution:</span> {session.institution}</span>
                )}
              </div>

              <p className="text-black text-sm md:text-base max-w-2xl">
                {session.type === "trial"
                  ? "Free trial account — full catalog access until your trial ends."
                  : `Licensed titles for ${session.name}, term ${session.startDate} to ${session.endDate}.`}
              </p>
            </div>

            <div className="flex-shrink-0">
              {expired ? (
                <div className="flex items-center gap-2 bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg font-semibold text-sm">
                  <AlertTriangle size={16} /> Access expired
                </div>
              ) : expiringSoon ? (
                <div className="flex items-center gap-2 bg-yellow-900/50 text-[#FDD132] border border-yellow-900/50 px-4 py-2 rounded-lg font-semibold text-sm">
                  <Clock size={16} /> {daysLeft} days left
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-800 text-green-400 border border-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">
                  <Clock size={16} /> Active until {session.endDate}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-24">
        {expired ? (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Period Ended</h2>
            <p className="text-black mb-6 max-w-md mx-auto">This access period has ended. Contact the publisher to renew and restore reading access.</p>
          </div>
        ) : (
          <>
            {/* Curated For You (Shown when no filter is isolating view) */}
            {!isFilteredView && curatedBooks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-12 p-8 md:p-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-black mb-2 uppercase tracking-widest" style={fontDisplay}>
                      Curated For You
                    </h2>
                    <p className="text-black text-sm max-w-md">
                      Tailored to your reading history and preferences based on your past activity.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCuratedIndex(Math.max(0, curatedIndex - 1))}
                      disabled={curatedIndex === 0}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black disabled:opacity-40 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCuratedIndex(Math.min(curatedBooks.length - 1, curatedIndex + 1))}
                      disabled={curatedIndex >= curatedBooks.length - 1}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black disabled:opacity-40 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div className="flex w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${curatedIndex * 100}%)` }}>
                    {curatedBooks.map((b) => (
                      <div key={b.id} className="w-full flex-shrink-0 flex flex-col md:flex-row gap-8 items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div
                          className="w-32 md:w-48 aspect-[1/1.4] rounded-lg shadow-md bg-[length:100%_100%] bg-center bg-no-repeat flex-shrink-0"
                          style={{ backgroundColor: b.color || '#333', backgroundImage: b.coverUrl ? `url(${b.coverUrl})` : 'none' }}
                        />
                        <div className="flex-1 text-left">
                          <span className="text-[#D4A017] text-xs font-bold uppercase tracking-wider mb-2 block">{b.genre}</span>
                          <h3 className="text-black text-2xl md:text-3xl font-bold mb-3 leading-tight" style={fontDisplay}>{b.title}</h3>
                          <p className="text-black text-sm mb-6 line-clamp-2">{b.author}</p>
                          <button
                            onClick={() => onOpenBook(b.id)}
                            className="bg-black text-white font-bold px-6 py-3 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout: Left Sidebar + Right Content */}
            <div className="flex flex-col lg:flex-row gap-10 w-full items-start">
              
              {/* LEFT SIDEBAR */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
                
                {/* CLEAR ALL BUTTON AT TOP */}
                <div className="pb-2">
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider hover:text-gray-600 transition-colors pl-2.5 border-l-2 border-black cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* TYPE */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4 text-black" style={fontDisplay}>
                    Type
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={collectionFilter}
                          onChange={(e) => setCollectionFilter(e.target.checked)}
                          className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                        <span className="text-black text-sm">Collection</span>
                      </div>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center">
                        {myBooksRaw.length > 0 ? 1 : 0}
                      </span>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.checked)}
                          className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                        <span className="text-black text-sm font-medium">eBook</span>
                      </div>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center">
                        {myBooksRaw.length}
                      </span>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={tokenFilter}
                          onChange={(e) => setTokenFilter(e.target.checked)}
                          className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                        <span className="text-black text-sm">Tokens</span>
                      </div>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center">
                        0
                      </span>
                    </label>
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4 text-black" style={fontDisplay}>
                    Category
                  </h3>
                  <div className="space-y-3 mb-4">
                    {allGenres.slice(0, 7).map((g) => (
                      <label key={g} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(g)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                              else setSelectedGenres(selectedGenres.filter((x) => x !== g));
                            }}
                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-black truncate group-hover:underline" title={g}>
                            {g}
                          </span>
                        </div>
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">
                          {genreCounts[g] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allGenres.length > 7 && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="text-xs font-bold uppercase tracking-wider text-black hover:underline cursor-pointer block"
                    >
                      + Show all category
                    </button>
                  )}
                </div>

                {/* AUTHOR */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4 text-black" style={fontDisplay}>
                    Author
                  </h3>
                  <div className="space-y-3 mb-4">
                    {allAuthorsList.slice(0, 5).map((a) => (
                      <label key={a} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={selectedAuthors.includes(a)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                              else setSelectedAuthors(selectedAuthors.filter((x) => x !== a));
                            }}
                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-black truncate group-hover:underline" title={a}>
                            {a}
                          </span>
                        </div>
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">
                          {authorCounts[a] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allAuthorsList.length > 5 && (
                    <button
                      onClick={() => setShowAuthorModal(true)}
                      className="text-xs font-bold uppercase tracking-wider text-black hover:underline cursor-pointer block"
                    >
                      + Show all author
                    </button>
                  )}
                </div>

                {/* PUBLICATION YEAR */}
                {allYearsList.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm tracking-wider uppercase mb-4 text-black" style={fontDisplay}>
                      Publication Year
                    </h3>
                    <div className="space-y-3 mb-4">
                      {allYearsList.slice(0, 5).map((y) => (
                        <label key={y} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <input
                              type="checkbox"
                              checked={selectedYears.includes(y)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedYears([...selectedYears, y]);
                                else setSelectedYears(selectedYears.filter((x) => x !== y));
                              }}
                              className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                            />
                            <span className="text-sm text-black truncate group-hover:underline" title={y}>
                              {y}
                            </span>
                          </div>
                          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">
                            {yearCounts[y] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                    {allYearsList.length > 5 && (
                      <button
                        onClick={() => setShowYearModal(true)}
                        className="text-xs font-bold uppercase tracking-wider text-black hover:underline cursor-pointer block"
                      >
                        + Show all publication year
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 w-full min-w-0">
                {/* When a Category / Filter is Selected -> Filtered Products View with Sort, View Switcher & Tags */}
                {isFilteredView ? (
                  <div>
                    {/* Top Control Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-200">
                      <div>
                        <h2 className="text-base font-bold text-black" style={fontDisplay}>
                          Showing {startItem}-{endItem} of {sortedBooks.length} products
                        </h2>
                      </div>

                      {/* Controls: Sort and Grid/List Switcher */}
                      <div className="flex items-center gap-3 relative">
                        {/* Sort Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-black rounded transition-colors cursor-pointer"
                          >
                            <span>Sort</span>
                            <ArrowUpDown size={13} />
                          </button>

                          {showSortDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setShowSortDropdown(false)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded shadow-xl z-40 py-1">
                                {sortOptions.map((opt) => (
                                  <button
                                    key={opt.id}
                                    onClick={() => {
                                      setSortBy(opt.id);
                                      setShowSortDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                      sortBy === opt.id ? "text-blue-600 font-bold bg-blue-50/50" : "text-black"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {sortBy === opt.id && <Check size={14} className="text-blue-600" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* View Switcher: Grid vs List */}
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                          <button
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                            className={`p-2 transition-colors cursor-pointer ${
                              viewMode === "grid" ? "bg-gray-100 text-black font-bold" : "bg-white text-gray-500 hover:text-black"
                            }`}
                          >
                            <LayoutGrid size={16} />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            title="List View"
                            className={`p-2 border-l border-gray-300 transition-colors cursor-pointer ${
                              viewMode === "list" ? "bg-gray-100 text-black font-bold" : "bg-white text-gray-500 hover:text-black"
                            }`}
                          >
                            <List size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Pills / Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-8">
                      {typeFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          eBook
                          <button onClick={() => setTypeFilter(false)} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {tokenFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          Tokens
                          <button onClick={() => setTokenFilter(false)} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {collectionFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          Collection
                          <button onClick={() => setCollectionFilter(false)} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {selectedGenres.map((g) => (
                        <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          {g}
                          <button onClick={() => setSelectedGenres(selectedGenres.filter((x) => x !== g))} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                      {selectedAuthors.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          Author: {a}
                          <button onClick={() => setSelectedAuthors(selectedAuthors.filter((x) => x !== a))} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                      {selectedYears.map((y) => (
                        <span key={y} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D9EEFA] text-[#1E5D88] rounded-full text-xs font-semibold">
                          Year: {y}
                          <button onClick={() => setSelectedYears(selectedYears.filter((x) => x !== y))} className="hover:text-black cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                    </div>

                    {/* Products Content */}
                    {sortedBooks.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-black font-semibold mb-3">No books found matching your selected filters.</p>
                        <button
                          onClick={handleClearAll}
                          className="text-xs font-bold uppercase tracking-wider text-black underline cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : viewMode === "grid" ? (
                      /* GRID VIEW (Screenshot 1) */
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                        {paginatedBooks.map((b) => (
                          <div key={b.id} className="flex flex-col bg-white">
                            {/* Cover */}
                            <div
                              onClick={() => onOpenBook(b.id)}
                              className="w-full aspect-[1/1.4] rounded bg-white shadow-sm border border-gray-200 overflow-hidden relative mb-3 cursor-pointer group/card"
                            >
                              <div
                                className="w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat transition-transform duration-300 group-hover/card:scale-105"
                                style={{
                                  backgroundColor: b.color || "#f3f4f6",
                                  backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : "none"
                                }}
                              />
                            </div>

                            {/* Badges / Type */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1">
                              <span>{b.pubType?.toUpperCase() || "EBOOK"}</span>
                              <BookOpen size={13} className="text-gray-700" />
                            </div>

                            {/* Title */}
                            <h4
                              onClick={() => onOpenBook(b.id)}
                              className="text-sm font-bold text-black leading-snug line-clamp-2 min-h-[2.5rem] mb-1 cursor-pointer hover:underline"
                              title={b.title}
                              style={fontDisplay}
                            >
                              {b.title}
                            </h4>

                            {/* Author */}
                            <p className="text-xs text-gray-600 truncate mb-1" title={b.author}>
                              by {b.author || "Unknown"}
                            </p>

                            {/* Edition */}
                            <p className="text-xs text-black font-medium mb-3">
                              Edition : 1
                            </p>

                            {/* Details Button with Wiley Loading Sweep Animation */}
                            <div className="w-full mt-auto pt-1">
                              <WileyDetailsButton
                                onClick={() => onOpenBook(b.id)}
                                fullWidth
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* LIST VIEW (Screenshot 3) */
                      <div className="space-y-8 mb-12">
                        {paginatedBooks.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-col sm:flex-row gap-6 p-6 bg-white border border-gray-200 rounded-sm shadow-sm"
                          >
                            {/* Left Cover */}
                            <div
                              onClick={() => onOpenBook(b.id)}
                              className="w-36 sm:w-44 aspect-[1/1.4] bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer group/card"
                            >
                              <div
                                className="w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat transition-transform duration-300 group-hover/card:scale-105"
                                style={{
                                  backgroundColor: b.color || "#f3f4f6",
                                  backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : "none"
                                }}
                              />
                            </div>

                            {/* Right Info */}
                            <div className="flex-1 flex flex-col min-w-0">
                              <h3
                                onClick={() => onOpenBook(b.id)}
                                className="text-xl font-bold text-black mb-1 cursor-pointer hover:underline"
                                style={fontDisplay}
                              >
                                {b.title}
                              </h3>
                              <p className="text-sm text-gray-700 mb-1">
                                by {b.author || "Unknown"}
                              </p>
                              <p className="text-sm text-black font-medium mb-4">
                                Edition : 1
                              </p>

                              <div className="mb-5">
                                <WileyDetailsButton
                                  onClick={() => onOpenBook(b.id)}
                                />
                              </div>

                              {/* Description with ...Show More */}
                              <div className="text-sm text-gray-800 leading-relaxed max-w-3xl">
                                <p className={expandedDesc[b.id] ? "" : "line-clamp-3"}>
                                  {b.description ||
                                    "Presents a thorough overview of this subject matter, delivering essential insights and structured perspectives for researchers and avid readers."}
                                </p>
                                {b.description && b.description.length > 120 && (
                                  <button
                                    onClick={() => toggleDesc(b.id)}
                                    className="text-blue-600 hover:underline text-xs font-semibold mt-1 cursor-pointer italic"
                                  >
                                    {expandedDesc[b.id] ? "Show Less" : "...Show More"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PAGINATION (As per inventory) */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6 pb-12 border-t border-gray-200">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-9 h-9 flex items-center justify-center rounded border border-gray-300 text-black disabled:opacity-30 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => setCurrentPage(num)}
                            className={`w-9 h-9 flex items-center justify-center rounded text-sm font-semibold transition-colors cursor-pointer ${
                              currentPage === num
                                ? "bg-black text-white"
                                : "border border-gray-300 text-black hover:bg-gray-100"
                            }`}
                          >
                            {num}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-9 h-9 flex items-center justify-center rounded border border-gray-300 text-black disabled:opacity-30 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MAIN DASHBOARD: One-by-One Category Carousels */
                  <div>
                    {displayedCategories.map((genre) => {
                      const booksInGenre =
                        genre === "All Titles"
                          ? myBooks
                          : myBooks.filter((b) => b.genre === genre);
                      if (booksInGenre.length === 0) return null;
                      return (
                        <CategoryCarouselRow
                          key={genre}
                          genre={genre}
                          books={booksInGenre}
                          onOpenBook={onOpenBook}
                          onSelectGenre={(g) => setSelectedGenres([g])}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={fontDisplay}>All Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-black hover:text-black transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <button onClick={() => setSelectedGenres([])} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Clear Selection
                </button>
                <button onClick={() => setSelectedGenres(allGenres)} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                {allGenres.map((g) => (
                  <label key={g} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(g)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                          else setSelectedGenres(selectedGenres.filter((x) => x !== g));
                        }}
                        className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-black truncate group-hover:underline" title={g}>{g}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">{genreCounts[g] || 0}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowCategoryModal(false)} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {showAuthorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={fontDisplay}>All Authors</h2>
              <button onClick={() => setShowAuthorModal(false)} className="text-black hover:text-black transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <button onClick={() => setSelectedAuthors([])} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Clear Selection
                </button>
                <button onClick={() => setSelectedAuthors(allAuthorsList)} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                {allAuthorsList.map((a) => (
                  <label key={a} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={selectedAuthors.includes(a)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                          else setSelectedAuthors(selectedAuthors.filter((x) => x !== a));
                        }}
                        className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-black truncate group-hover:underline" title={a}>{a}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">{authorCounts[a] || 0}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowAuthorModal(false)} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={fontDisplay}>All Publication Years</h2>
              <button onClick={() => setShowYearModal(false)} className="text-black hover:text-black transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <button onClick={() => setSelectedYears([])} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Clear Selection
                </button>
                <button onClick={() => setSelectedYears(allYearsList)} className="text-sm font-semibold text-black hover:underline cursor-pointer">
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {allYearsList.map((y) => (
                  <label key={y} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(y)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedYears([...selectedYears, y]);
                          else setSelectedYears(selectedYears.filter((x) => x !== y));
                        }}
                        className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-black truncate group-hover:underline" title={y}>{y}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2">{yearCounts[y] || 0}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowYearModal(false)} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}