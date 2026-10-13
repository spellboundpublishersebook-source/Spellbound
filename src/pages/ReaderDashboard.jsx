import React, { useState, useMemo, useRef, useEffect } from "react";
import { Clock, AlertTriangle, BookOpen, ChevronRight, ChevronLeft, X, User, Mail, Building2 } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { daysUntil } from "../data/mockData";

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
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-gray-200">
        <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight" style={fontDisplay}>
          {genre}
        </h2>
        <button
          onClick={() => onSelectGenre(genre)}
          className="flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-600 transition-colors pl-3 border-l-2 border-black cursor-pointer"
        >
          View All
        </button>
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

              {/* Details Button */}
              <button
                onClick={() => onOpenBook(b.id)}
                className="w-full mt-auto py-2 px-3 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors text-xs font-semibold text-center rounded-none shadow-sm cursor-pointer"
              >
                Details
              </button>
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
  const [typeFilter, setTypeFilter] = useState(true); // eBook checked by default
  const [collectionFilter, setCollectionFilter] = useState(false);
  const [tokenFilter, setTokenFilter] = useState(false);

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

  const myBooks = useMemo(() => {
    return myBooksRaw.filter((b) => {
      const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      const matchesA = selectedAuthors.length === 0 || selectedAuthors.includes(b.author);
      const bookYear = b.firstPublish ? b.firstPublish.toString().match(/\b(19\d{2}|20\d{2})\b/)?.[0] : null;
      const matchesY = selectedYears.length === 0 || (bookYear && selectedYears.includes(bookYear));
      return matchesG && matchesA && matchesY;
    });
  }, [myBooksRaw, selectedGenres, selectedAuthors, selectedYears]);

  const displayedCategories = useMemo(() => {
    if (selectedGenres.length > 0) return selectedGenres;
    const genresWithBooks = Array.from(new Set(myBooks.map((b) => b.genre).filter(Boolean))).sort();
    return genresWithBooks.length > 0 ? genresWithBooks : ["All Titles"];
  }, [selectedGenres, myBooks]);

  const daysLeft = daysUntil(session.endDate);
  const expiringSoon = daysLeft <= 15 && daysLeft > 0;
  const expired = daysLeft < 0;

  const curatedBooks = useMemo(() => {
    return [...myBooksRaw].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [myBooksRaw]);

  const [curatedIndex, setCuratedIndex] = useState(0);

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
            {/* Curated For You */}
            {curatedBooks.length > 0 && (
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
                            Read Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout: Left Sidebar + Category Rows */}
            <div className="flex flex-col lg:flex-row gap-10 w-full items-start">
              {/* LEFT SIDEBAR */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-10">
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
                    {allGenres.slice(0, 5).map((g) => (
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
                  {allGenres.length > 5 && (
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

              {/* Right Content - Category Rows (One by One) */}
              <div className="flex-1 w-full min-w-0">
                {myBooks.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-black font-semibold mb-3">No books found matching your selected filters.</p>
                    <button
                      onClick={() => {
                        setSelectedGenres([]);
                        setSelectedAuthors([]);
                        setSelectedYears([]);
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-black underline cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
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
                          onSelectGenre={(g) => {
                            if (selectedGenres.includes(g)) {
                              setSelectedGenres(selectedGenres.filter((x) => x !== g));
                            } else {
                              setSelectedGenres([g]);
                            }
                          }}
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