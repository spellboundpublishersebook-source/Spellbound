import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Clock, AlertTriangle, BookOpen, ChevronRight, ChevronLeft, X, 
  User, Mail, Building2, ArrowUpDown, LayoutGrid, List, Check,
  GraduationCap, Plus, Key, ShieldCheck, Search
} from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { daysUntil } from "../data/mockData";
import AnimatedSweepButton from "../components/AnimatedSweepButton";
import BookCover from "../components/BookCover";
import { Modal } from "../components/UI";

// Wiley-Style Animated Details Button with Counter-Translation Mask
function WileyDetailsButton({ onClick, className = "", fullWidth = false }) {
  return (
    <AnimatedSweepButton
      onClick={onClick}
      variant="outline"
      className={`text-xs font-semibold tracking-wider rounded-[2px] shadow-sm ${
        fullWidth ? "w-full h-[32px] py-1.5 px-3" : "w-[120px] h-[32px] py-1.5 px-4"
      } ${className}`}
    >
      Details
    </AnimatedSweepButton>
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
      <div className="pb-3 mb-6 border-b border-black/10 flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#111214] tracking-tight" style={fontDisplay}>
          {genre}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous books"
            className="absolute -left-3 top-1/3 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#111214] text-[#F5F23B] flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {books.map((b) => (
            <div
              key={b.id}
              className="w-[188px] sm:w-[204px] flex-shrink-0 flex flex-col admin-glass-panel p-3.5 rounded-2xl hover:border-[#111214]/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer group/card"
            >
              {/* Cover */}
              <div
                onClick={() => onOpenBook(b.id)}
                className="w-full aspect-[1/1.4] rounded-xl bg-white/80 shadow-sm border border-white overflow-hidden relative mb-3 cursor-pointer group/card"
              >
                <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
              </div>

              {/* Badges / Type */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                <span>{b.pubType?.toUpperCase() || "EBOOK"}</span>
                <BookOpen size={13} className="text-slate-700" />
              </div>

              {/* Title */}
              <h4
                onClick={() => onOpenBook(b.id)}
                className="text-sm font-bold text-[#111214] leading-snug line-clamp-2 min-h-[2.5rem] mb-1 cursor-pointer hover:underline"
                title={b.title}
                style={fontDisplay}
              >
                {b.title}
              </h4>

              {/* Author */}
              <p className="text-xs text-slate-600 truncate mb-1" title={b.author}>
                by {b.author || "Unknown"}
              </p>

              {/* Edition */}
              <p className="text-xs text-slate-800 font-medium mb-3">
                Edition : 1
              </p>

              {/* Details Button */}
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
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next books"
            className="absolute -right-3 top-1/3 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#111214] text-[#F5F23B] flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* View All Button */}
      <div className="flex justify-end mt-3 pr-1">
        <button
          type="button"
          onClick={() => onSelectGenre(genre)}
          className="admin-glass-pill inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-[#111214] hover:bg-[#111214] hover:text-[#F5F23B] transition-all cursor-pointer group whitespace-nowrap shrink-0"
        >
          <span>View All</span>
          <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

export default function ReaderDashboard({
  session,
  books,
  onOpenBook,
  onCreateStudentProfile,
  onSwitchStudentProfile,
  onSwitchToDeptLogin
}) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  // Student Profile Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentTab, setStudentTab] = useState("create"); // "create" | "switch"
  const [selectedDeptId, setSelectedDeptId] = useState(session.deptId || (session.departments && session.departments[0]?.id) || "");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newStudentPw, setNewStudentPw] = useState("");
  const [switchStudentId, setSwitchStudentId] = useState("");
  const [switchStudentPw, setSwitchStudentPw] = useState("");
  const [studentError, setStudentError] = useState("");
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const activeDeptObj = useMemo(() => {
    const list = Array.isArray(session.departments) ? session.departments : [];
    if (selectedDeptId) return list.find(d => d.id === selectedDeptId) || list[0] || null;
    return list.find(d => d.id === session.deptId) || list[0] || null;
  }, [session, selectedDeptId]);

  async function handleStudentSubmit(e) {
    e.preventDefault();
    setStudentError("");
    if (!newStudentName.trim() || !newStudentRoll.trim() || !newStudentPw.trim()) {
      setStudentError("Please fill out all fields.");
      return;
    }

    const targetLicId = session.institutionId || session.id;
    const targetDeptId = selectedDeptId || session.deptId || (activeDeptObj?.id);
    if (!targetDeptId) {
      setStudentError("Please select a department first.");
      return;
    }

    setIsCreatingStudent(true);
    const res = await onCreateStudentProfile(targetLicId, targetDeptId, {
      name: newStudentName.trim(),
      studentId: newStudentRoll.trim(),
      password: newStudentPw.trim()
    });
    setIsCreatingStudent(false);

    if (res && res.ok) {
      setShowStudentModal(false);
      setNewStudentName("");
      setNewStudentRoll("");
      setNewStudentPw("");
    } else {
      setStudentError(res?.message || "Failed to create student profile.");
    }
  }

  async function handleStudentSwitch(e) {
    e.preventDefault();
    setStudentError("");
    if (!switchStudentId.trim()) {
      setStudentError("Please select or enter your Student ID.");
      return;
    }
    const targetLicId = session.institutionId || session.id;
    const targetDeptId = selectedDeptId || session.deptId || (activeDeptObj?.id);
    if (!targetDeptId) {
      setStudentError("Please select a department.");
      return;
    }
    const res = await onSwitchStudentProfile(targetLicId, targetDeptId, switchStudentId.trim(), switchStudentPw.trim());
    if (res && res.ok) {
      setShowStudentModal(false);
      setSwitchStudentId("");
      setSwitchStudentPw("");
    } else {
      setStudentError(res?.message || "Could not switch student profile.");
    }
  }

  function handleSwitchToDept() {
    const targetLicId = session.institutionId || session.id;
    const targetDeptId = session.deptId || selectedDeptId || (activeDeptObj?.id);
    if (onSwitchToDeptLogin) {
      onSwitchToDeptLogin(targetLicId, targetDeptId);
    }
    setShowStudentModal(false);
  }
  
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
    // books passed from App is availableBooks (authoritative list of accessible titles)
    return Array.isArray(books) ? books : [];
  }, [books]);

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
    return selectedGenres.length > 0 || selectedAuthors.length > 0 || selectedYears.length > 0 || tokenFilter || collectionFilter || Boolean(searchQuery.trim());
  }, [selectedGenres, selectedAuthors, selectedYears, tokenFilter, collectionFilter, searchQuery]);

  // Filtered books
  const myBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myBooksRaw.filter((b) => {
      const matchesSearch = !q || (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.genre && b.genre.toLowerCase().includes(q)) ||
        (b.publisher && b.publisher.toLowerCase().includes(q)) ||
        (b.onlineIsbn && b.onlineIsbn.toLowerCase().includes(q)) ||
        (b.printIsbn && b.printIsbn.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
      const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      const matchesA = selectedAuthors.length === 0 || selectedAuthors.includes(b.author);
      const bookYear = b.firstPublish ? b.firstPublish.toString().match(/\b(19\d{2}|20\d{2})\b/)?.[0] : null;
      const matchesY = selectedYears.length === 0 || (bookYear && selectedYears.includes(bookYear));
      return matchesSearch && matchesG && matchesA && matchesY;
    });
  }, [myBooksRaw, searchQuery, selectedGenres, selectedAuthors, selectedYears]);

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

  // Helper for human-readable relative time
  function formatRelativeTime(isoString) {
    if (!isoString) return "";
    try {
      const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return new Date(isoString).toLocaleDateString();
    } catch (_) {
      return "";
    }
  }

  // Student Continue Reading List (Strictly reserved ONLY for Student profile mode and isolated per student)
  const studentKey = session?.studentId;
  const continueReadingList = useMemo(() => {
    if (session?.type !== "student" || !studentKey) return [];
    const map = new Map();

    const validIds = new Set(myBooksRaw.map((b) => b.id));

    // 1. Check local continue reading list FOR THIS SPECIFIC STUDENT ONLY (pruning revoked books)
    try {
      const localSaved = localStorage.getItem(`continue_reading_${studentKey}`);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed)) {
          const pruned = parsed.filter((item) => item && item.bookId && validIds.has(item.bookId));
          if (pruned.length !== parsed.length) {
            localStorage.setItem(`continue_reading_${studentKey}`, JSON.stringify(pruned));
          }
          pruned.forEach((item) => {
            if (item && item.bookId) {
              map.set(item.bookId, item);
            }
          });
        }
      }
    } catch (_) {}

    // 2. Check DB reading progress from THIS STUDENT'S profile ONLY (never shared dept progress, skip revoked books)
    const dbProgress = session?.currentStudent?.customizations?.readingProgress || {};

    Object.keys(dbProgress).forEach((bookId) => {
      if (!validIds.has(bookId)) return;
      const p = dbProgress[bookId];
      if (p && (p.page || p.lastPage)) {
        const existing = map.get(bookId);
        if (!existing || new Date(p.lastReadAt || 0) > new Date(existing.lastReadAt || 0)) {
          map.set(bookId, { bookId, ...p });
        }
      }
    });

    // 3. Check individual book storage keys FOR THIS SPECIFIC STUDENT ONLY
    myBooksRaw.forEach((b) => {
      if (!map.has(b.id)) {
        try {
          const raw = localStorage.getItem(`reader_progress_${studentKey}_${b.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.page || parsed.lastPage)) {
              map.set(b.id, { bookId: b.id, ...parsed });
            }
          }
        } catch (_) {}
      }
    });

    // Resolve book objects from myBooksRaw
    const result = [];
    map.forEach((prog, bId) => {
      const bookObj = myBooksRaw.find((b) => b.id === bId);
      if (bookObj) {
        const lastPage = Number(prog.page || prog.lastPage || 1);
        const total = Number(prog.totalPages || bookObj.totalPages || 1);
        const percent = Math.min(100, Math.max(1, Math.round((lastPage / Math.max(total, 1)) * 100)));
        result.push({
          book: bookObj,
          progress: {
            page: lastPage,
            totalPages: total,
            percent,
            sectionId: prog.sectionId || null,
            lastReadAt: prog.lastReadAt || null,
          },
        });
      }
    });

    // Sort: most recently read first
    result.sort((a, b) => new Date(b.progress.lastReadAt || 0) - new Date(a.progress.lastReadAt || 0));
    return result;
  }, [session?.type, studentKey, session?.currentStudent?.customizations?.readingProgress, myBooksRaw]);

  const filteredContinueReading = useMemo(() => {
    if (!searchQuery.trim()) return continueReadingList;
    const q = searchQuery.trim().toLowerCase();
    return continueReadingList.filter(({ book }) => (
      (book.title && book.title.toLowerCase().includes(q)) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.genre && book.genre.toLowerCase().includes(q)) ||
      (book.onlineIsbn && book.onlineIsbn.toLowerCase().includes(q))
    ));
  }, [continueReadingList, searchQuery]);

  const handleClearAll = () => {
    setSearchQuery("");
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
    <div className="admin-glass-backdrop min-h-screen text-[#111214]" style={fontBody}>
      {/* Frosted Header Shell */}
      <div className="pt-6 pb-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto admin-glass-shell rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#111214] text-[#F5F23B] rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 shadow-sm">
                Reader Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-[#111214]" style={fontDisplay}>
                {session.name}'s Library
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 mt-3 text-xs sm:text-sm text-[#111214] admin-glass-pill py-2.5 px-4 rounded-2xl inline-flex max-w-full">
                <span className="flex items-center gap-1.5"><User size={15} className="text-slate-700" /> <span className="font-bold">ID:</span> {session.id}</span>
                {session.email && (
                  <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-700" /> <span className="font-bold">Email:</span> {session.email}</span>
                )}
                {session.institution && (
                  <span className="flex items-center gap-1.5"><Building2 size={15} className="text-slate-700" /> <span className="font-bold">College:</span> {session.institution}</span>
                )}
                {session.department && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/90 text-blue-900 font-bold text-xs border border-blue-200">
                    Dept: {session.department} {session.deptCode ? `(${session.deptCode})` : ""}
                  </span>
                )}
                {session.type === "student" && session.studentName && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 font-bold text-xs border border-emerald-200">
                    <GraduationCap size={13} /> Student: {session.studentName} ({session.studentId})
                  </span>
                )}
                {session.type === "student" ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => { setShowStudentModal(true); setStudentError(""); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111214] text-[#F5F23B] hover:bg-black font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <GraduationCap size={13} />
                      Switch Student Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToDept}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-blue-900 hover:bg-blue-100 border border-blue-300 font-bold text-xs shadow-sm transition-all cursor-pointer"
                      title="Switch back to shared Department Login"
                    >
                      <Building2 size={13} />
                      Switch to Dept Login
                    </button>
                  </div>
                ) : (
                  (session.type === "department" || (session.departments && session.departments.length > 0)) && (
                    <button
                      type="button"
                      onClick={() => { setShowStudentModal(true); setStudentError(""); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#111214] text-[#F5F23B] hover:bg-black font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 ml-auto"
                    >
                      <GraduationCap size={13} />
                      👤 Create / Switch to Student ID
                    </button>
                  )
                )}
              </div>

              {session.type === "department" && (
                <div className="mt-2.5 p-3 rounded-2xl bg-blue-50/90 border border-blue-200/90 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-700 shrink-0" />
                    <span>
                      <strong>Department Shared Login:</strong> Full catalog reading enabled. Personal customization features (highlighter, sticky notes, study notebook) are reserved for Personal Student Profiles.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowStudentModal(true); setStudentTab("create"); setStudentError(""); }}
                    className="underline font-bold text-blue-900 hover:text-black shrink-0 cursor-pointer"
                  >
                    Create Free Student Profile →
                  </button>
                </div>
              )}

              <p className="text-slate-700 text-sm md:text-base max-w-2xl">
                {session.type === "trial"
                  ? "Free trial account — full catalog access until your trial ends."
                  : `Licensed titles for ${session.name}, term ${session.startDate} to ${session.endDate}.`}
              </p>
            </div>

            <div className="flex-shrink-0">
              {expired ? (
                <div className="flex items-center gap-2 bg-rose-100/90 text-rose-800 border border-rose-200 px-4 py-2.5 rounded-full font-bold text-xs shadow-sm">
                  <AlertTriangle size={15} /> Access expired
                </div>
              ) : expiringSoon ? (
                <div className="flex items-center gap-2 bg-[#F5F23B] text-[#111214] border border-amber-300 px-4 py-2.5 rounded-full font-bold text-xs shadow-sm">
                  <Clock size={15} /> {daysLeft} days left
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#111214] text-[#F5F23B] px-4 py-2.5 rounded-full font-bold text-xs shadow-md">
                  <Clock size={15} /> Active until {session.endDate}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20 pb-24">
        {expired ? (
          <div className="admin-glass-panel rounded-[26px] p-8 text-center border-rose-200">
            <AlertTriangle size={48} className="mx-auto text-rose-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#111214]">Access Period Ended</h2>
            <p className="text-slate-700 mb-6 max-w-md mx-auto">This access period has ended. Contact the publisher to renew and restore reading access.</p>
          </div>
        ) : (
          <>
            {/* Prominent Library Search Bar for Dept & Student Access */}
            <div className="mb-8">
              <div className="relative max-w-2xl mx-auto">
                <div className="flex items-center bg-[#FAF7EE] paper-texture rounded-full p-1.5 sm:p-2 w-full relative z-20 shadow-md border-2 border-[#E2D6C0] focus-within:border-[#111214] transition-all">
                  <Search size={18} className="ml-3.5 text-slate-600 flex-shrink-0" />
                  <input
                    type="text"
                    aria-label="Search library titles, authors, or subjects"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={
                      session?.type === "student"
                        ? `Search ${session.name || "student"}'s library by title, author, or subject...`
                        : `Search department titles by title, author, or subject...`
                    }
                    className="flex-1 bg-transparent border-none outline-none px-3 py-1.5 text-[#111214] placeholder:text-slate-500 w-full text-sm font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 mr-2 transition-all cursor-pointer flex-shrink-0"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="bg-[#111214] hover:bg-black text-[#F5F23B] px-5 sm:px-6 py-2 rounded-full text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Active search query status / clear button */}
                {searchQuery.trim() && (
                  <div className="mt-2.5 flex items-center justify-between text-xs px-4 text-slate-700">
                    <span>
                      Found <strong>{myBooks.length}</strong> title{myBooks.length === 1 ? "" : "s"} matching "<strong>{searchQuery}</strong>"
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="font-bold text-[#111214] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <X size={13} /> Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Reading Section (Shown ONLY when reader is student and has books in progress) */}
            {session?.type === "student" && selectedGenres.length === 0 && selectedAuthors.length === 0 && selectedYears.length === 0 && filteredContinueReading.length > 0 && (
              <div className="admin-glass-panel rounded-[26px] overflow-hidden mb-10 p-6 sm:p-8 relative border-l-4 border-l-[#F5F23B]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-black/10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F5F23B] text-[#111214] text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-sm">
                      <Clock size={12} strokeWidth={2.5} />
                      Continue Reading
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#111214] tracking-tight" style={fontDisplay}>
                      Pick up where you left off
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      Jump straight back into your reading session — opens directly at your saved page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/70 px-3.5 py-1.5 rounded-full border border-white shrink-0 shadow-sm">
                    <BookOpen size={13} className="text-slate-600" />
                    <span>{filteredContinueReading.length} title{filteredContinueReading.length > 1 ? "s" : ""} in progress</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredContinueReading.slice(0, 6).map(({ book, progress }) => (
                    <div
                      key={book.id}
                      onClick={() => onOpenBook(book.id, progress.page)}
                      className="admin-glass-pill rounded-2xl p-4 flex gap-4 hover:border-[#111214]/40 hover:shadow-xl transition-all duration-300 group/cr cursor-pointer bg-white/80 relative overflow-hidden"
                    >
                      {/* Cover with % Badge */}
                      <div className="w-20 sm:w-24 aspect-[1/1.4] rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative bg-white">
                        <BookCover book={book} className="w-full h-full object-cover transition-transform duration-300 group-hover/cr:scale-105" />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[#F5F23B] text-[9px] font-extrabold tracking-wider shadow">
                          {progress.percent}%
                        </div>
                      </div>

                      {/* Info & Progress */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 truncate">
                              {book.genre || "Book"}
                            </span>
                            {progress.lastReadAt && (
                              <span className="text-[10px] text-slate-500 font-medium shrink-0">
                                {formatRelativeTime(progress.lastReadAt)}
                              </span>
                            )}
                          </div>

                          <h3
                            className="font-bold text-sm text-[#111214] leading-snug line-clamp-2 hover:underline mb-0.5"
                            title={book.title}
                            style={fontDisplay}
                          >
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-600 truncate mb-2" title={book.author}>
                            by {book.author || "Unknown"}
                          </p>
                        </div>

                        {/* Progress Bar & Actions */}
                        <div className="mt-2 pt-2 border-t border-black/5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                            <span>Page {progress.page} of {progress.totalPages}</span>
                            <span className="text-emerald-700">{progress.percent}% read</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mb-3">
                            <div
                              className="h-full rounded-full bg-[#111214] transition-all duration-500"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenBook(book.id, progress.page);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111214] hover:bg-black text-[#F5F23B] text-xs font-bold shadow-sm transition-all cursor-pointer"
                            >
                              <BookOpen size={13} />
                              <span>Resume Page {progress.page}</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curated For You (Shown when no filter is isolating view) */}
            {!isFilteredView && curatedBooks.length > 0 && (
              <div className="admin-glass-panel rounded-[26px] overflow-hidden mb-10 p-6 sm:p-9 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#111214] mb-1.5 uppercase tracking-wider" style={fontDisplay}>
                      Curated For You
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md">
                      Tailored to your reading history and preferences based on your past activity.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label="Previous curated title"
                      onClick={() => setCuratedIndex(Math.max(0, curatedIndex - 1))}
                      disabled={curatedIndex === 0}
                      className="w-10 h-10 rounded-full admin-glass-pill flex items-center justify-center text-[#111214] disabled:opacity-40 hover:bg-[#111214] hover:text-[#F5F23B] transition-all cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next curated title"
                      onClick={() => setCuratedIndex(Math.min(curatedBooks.length - 1, curatedIndex + 1))}
                      disabled={curatedIndex >= curatedBooks.length - 1}
                      className="w-10 h-10 rounded-full admin-glass-pill flex items-center justify-center text-[#111214] disabled:opacity-40 hover:bg-[#111214] hover:text-[#F5F23B] transition-all cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div className="flex w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${curatedIndex * 100}%)` }}>
                    {curatedBooks.map((b) => (
                      <div key={b.id} className="w-full flex-shrink-0 flex flex-col md:flex-row gap-7 items-center bg-white/65 backdrop-blur-md p-6 rounded-2xl border border-white/90">
                        <BookCover 
                          book={b} 
                          className="w-32 md:w-44 aspect-[1/1.4] rounded-xl shadow-md flex-shrink-0" 
                        />
                        <div className="flex-1 text-left">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F5F23B] text-[#111214] text-[11px] font-bold uppercase tracking-wider mb-2.5">{b.genre}</span>
                          <h3 className="text-[#111214] text-2xl md:text-3xl font-bold mb-2.5 leading-tight" style={fontDisplay}>{b.title}</h3>
                          <p className="text-slate-600 text-sm mb-6 line-clamp-2">{b.author}</p>
                          <AnimatedSweepButton
                            onClick={() => onOpenBook(b.id)}
                            variant="black"
                            className="font-bold px-6 py-2.5 rounded-full text-sm shadow-sm"
                          >
                            Details
                          </AnimatedSweepButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout: Left Sidebar + Right Content */}
            <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
              
              {/* LEFT SIDEBAR */}
              <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 admin-glass-panel rounded-[24px] p-5">
                
                {/* CLEAR ALL BUTTON AT TOP */}
                <div className="pb-2 border-b border-black/10 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filters</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-slate-600 hover:text-rose-600 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* TYPE */}
                <div>
                  <h3 className="font-bold text-xs tracking-wider uppercase mb-3 text-slate-700" style={fontDisplay}>
                    Type
                  </h3>
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={collectionFilter}
                          onChange={(e) => setCollectionFilter(e.target.checked)}
                          className="brand-check-fallback w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[#111214] text-sm">Collection</span>
                      </div>
                      <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center border border-white">
                        {myBooksRaw.length > 0 ? 1 : 0}
                      </span>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.checked)}
                          className="brand-check-fallback w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[#111214] text-sm font-medium">eBook</span>
                      </div>
                      <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center border border-white">
                        {myBooksRaw.length}
                      </span>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={tokenFilter}
                          onChange={(e) => setTokenFilter(e.target.checked)}
                          className="brand-check-fallback w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[#111214] text-sm">Tokens</span>
                      </div>
                      <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center border border-white">
                        0
                      </span>
                    </label>
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="font-bold text-xs tracking-wider uppercase mb-3 text-slate-700" style={fontDisplay}>
                    Category
                  </h3>
                  <div className="space-y-2.5 mb-3">
                    {allGenres.slice(0, 7).map((g) => (
                      <label key={g} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(g)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                              else setSelectedGenres(selectedGenres.filter((x) => x !== g));
                            }}
                            className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-[#111214] truncate group-hover:underline" title={g}>
                            {g}
                          </span>
                        </div>
                        <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-white">
                          {genreCounts[g] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allGenres.length > 7 && (
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-xs font-bold uppercase tracking-wider text-[#111214] hover:underline cursor-pointer block"
                    >
                      + Show all category
                    </button>
                  )}
                </div>

                {/* AUTHOR */}
                <div>
                  <h3 className="font-bold text-xs tracking-wider uppercase mb-3 text-slate-700" style={fontDisplay}>
                    Author
                  </h3>
                  <div className="space-y-2.5 mb-3">
                    {allAuthorsList.slice(0, 5).map((a) => (
                      <label key={a} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={selectedAuthors.includes(a)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                              else setSelectedAuthors(selectedAuthors.filter((x) => x !== a));
                            }}
                            className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-[#111214] truncate group-hover:underline" title={a}>
                            {a}
                          </span>
                        </div>
                        <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-white">
                          {authorCounts[a] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allAuthorsList.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAuthorModal(true)}
                      className="text-xs font-bold uppercase tracking-wider text-[#111214] hover:underline cursor-pointer block"
                    >
                      + Show all author
                    </button>
                  )}
                </div>

                {/* PUBLICATION YEAR */}
                {allYearsList.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xs tracking-wider uppercase mb-3 text-slate-700" style={fontDisplay}>
                      Publication Year
                    </h3>
                    <div className="space-y-2.5 mb-3">
                      {allYearsList.slice(0, 5).map((y) => (
                        <label key={y} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <input
                              type="checkbox"
                              checked={selectedYears.includes(y)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedYears([...selectedYears, y]);
                                else setSelectedYears(selectedYears.filter((x) => x !== y));
                              }}
                              className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                            />
                            <span className="text-sm text-[#111214] truncate group-hover:underline" title={y}>
                              {y}
                            </span>
                          </div>
                          <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-white">
                            {yearCounts[y] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                    {allYearsList.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowYearModal(true)}
                        className="text-xs font-bold uppercase tracking-wider text-[#111214] hover:underline cursor-pointer block"
                      >
                        + Show all publication year
                      </button>
                    )}
                  </div>
                )}
              </aside>

              {/* RIGHT CONTENT */}
              <div className="flex-1 w-full min-w-0">
                {/* When a Category / Filter is Selected -> Filtered Products View with Sort, View Switcher & Tags */}
                {isFilteredView ? (
                  <div>
                    {/* Top Control Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-black/10">
                      <div>
                        <h2 className="text-base font-bold text-[#111214]" style={fontDisplay}>
                          Showing {startItem}-{endItem} of {sortedBooks.length} products
                        </h2>
                      </div>

                      {/* Controls: Sort and Grid/List Switcher */}
                      <div className="flex items-center gap-3 relative">
                        {/* Sort Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="h-9 flex items-center gap-2 px-4 admin-glass-pill hover:bg-white text-xs font-bold text-[#111214] rounded-full transition-colors cursor-pointer"
                          >
                            <span>Sort</span>
                            <ArrowUpDown size={14} className="text-slate-700" />
                          </button>

                          {showSortDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setShowSortDropdown(false)}
                              />
                              <div className="absolute right-0 top-full mt-2 w-64 bg-[#FAF7EE] paper-texture border-2 border-[#E2D6C0] rounded-2xl shadow-2xl z-40 py-1.5 overflow-hidden">
                                {sortOptions.map((opt) => (
                                  <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => {
                                      setSortBy(opt.id);
                                      setShowSortDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between hover:bg-[#F5F23B]/25 transition-colors cursor-pointer ${
                                      sortBy === opt.id ? "text-[#111214] font-bold bg-[#F5F23B]/35" : "text-slate-700"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {sortBy === opt.id && <Check size={14} className="text-[#111214]" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* View Switcher: Grid vs List */}
                        <div className="h-9 flex items-center admin-glass-pill rounded-full overflow-hidden p-0.5">
                          <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                            aria-label="Grid view"
                            className={`h-full px-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                              viewMode === "grid" ? "bg-[#111214] text-[#F5F23B] font-bold" : "text-slate-600 hover:text-[#111214]"
                            }`}
                          >
                            <LayoutGrid size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            title="List View"
                            aria-label="List view"
                            className={`h-full px-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                              viewMode === "list" ? "bg-[#111214] text-[#F5F23B] font-bold" : "text-slate-600 hover:text-[#111214]"
                            }`}
                          >
                            <List size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Pills / Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-8">
                      {searchQuery.trim() && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#111214] text-[#F5F23B] rounded-full text-xs font-bold shadow-sm">
                          Search: "{searchQuery.trim()}"
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setCurrentPage(1);
                            }}
                            className="hover:opacity-80 cursor-pointer"
                            title="Clear search"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      )}
                      {typeFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#111214] text-[#F5F23B] rounded-full text-xs font-bold">
                          eBook
                          <button type="button" onClick={() => setTypeFilter(false)} className="hover:opacity-80 cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {tokenFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#111214] text-[#F5F23B] rounded-full text-xs font-bold">
                          Tokens
                          <button type="button" onClick={() => setTokenFilter(false)} className="hover:opacity-80 cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {collectionFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#111214] text-[#F5F23B] rounded-full text-xs font-bold">
                          Collection
                          <button type="button" onClick={() => setCollectionFilter(false)} className="hover:opacity-80 cursor-pointer"><X size={13} /></button>
                        </span>
                      )}
                      {selectedGenres.map((g) => (
                        <span key={g} className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#F5F23B] text-[#111214] rounded-full text-xs font-bold">
                          {g}
                          <button type="button" onClick={() => setSelectedGenres(selectedGenres.filter((x) => x !== g))} className="hover:opacity-75 cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                      {selectedAuthors.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3.5 py-1 admin-glass-pill text-[#111214] rounded-full text-xs font-bold">
                          Author: {a}
                          <button type="button" onClick={() => setSelectedAuthors(selectedAuthors.filter((x) => x !== a))} className="hover:opacity-75 cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                      {selectedYears.map((y) => (
                        <span key={y} className="inline-flex items-center gap-1.5 px-3.5 py-1 admin-glass-pill text-[#111214] rounded-full text-xs font-bold">
                          Year: {y}
                          <button type="button" onClick={() => setSelectedYears(selectedYears.filter((x) => x !== y))} className="hover:opacity-75 cursor-pointer"><X size={13} /></button>
                        </span>
                      ))}
                    </div>

                    {/* Products Content */}
                    {sortedBooks.length === 0 ? (
                      <div className="text-center py-20 admin-glass-panel rounded-2xl">
                        <p className="text-[#111214] font-semibold mb-3">No books found matching your selected filters.</p>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-xs font-bold uppercase tracking-wider text-[#111214] underline cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : viewMode === "grid" ? (
                      /* GRID VIEW */
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
                        {paginatedBooks.map((b) => (
                          <div key={b.id} className="flex flex-col admin-glass-panel p-3.5 rounded-2xl hover:border-[#111214]/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer group/card">
                            {/* Cover */}
                            <div
                              onClick={() => onOpenBook(b.id)}
                              className="w-full aspect-[1/1.4] rounded-xl bg-white/80 shadow-sm border border-white overflow-hidden relative mb-3 cursor-pointer group/card"
                            >
                              <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
                            </div>

                            {/* Badges / Type */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              <span>{b.pubType?.toUpperCase() || "EBOOK"}</span>
                              <BookOpen size={13} className="text-slate-700" />
                            </div>

                            {/* Title */}
                            <h4
                              onClick={() => onOpenBook(b.id)}
                              className="text-sm font-bold text-[#111214] leading-snug line-clamp-2 min-h-[2.5rem] mb-1 cursor-pointer hover:underline"
                              title={b.title}
                              style={fontDisplay}
                            >
                              {b.title}
                            </h4>

                            {/* Author */}
                            <p className="text-xs text-slate-600 truncate mb-1" title={b.author}>
                              by {b.author || "Unknown"}
                            </p>

                            {/* Edition */}
                            <p className="text-xs text-slate-800 font-medium mb-3">
                              Edition : 1
                            </p>

                            {/* Details Button */}
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
                      /* LIST VIEW */
                      <div className="space-y-6 mb-12">
                        {paginatedBooks.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-col sm:flex-row gap-6 p-6 admin-glass-panel hover:border-[#111214]/40 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group/card"
                          >
                            {/* Left Cover */}
                            <div
                              onClick={() => onOpenBook(b.id)}
                              className="w-36 sm:w-44 aspect-[1/1.4] bg-white/80 rounded-xl shadow-sm border border-white overflow-hidden flex-shrink-0 cursor-pointer group/card"
                            >
                              <BookCover book={b} className="w-full h-full transition-transform duration-300 group-hover/card:scale-105" />
                            </div>

                            {/* Right Info */}
                            <div className="flex-1 flex flex-col min-w-0">
                              <h3
                                onClick={() => onOpenBook(b.id)}
                                className="text-xl font-bold text-[#111214] mb-1 cursor-pointer hover:underline"
                                style={fontDisplay}
                              >
                                {b.title}
                              </h3>
                              <p className="text-sm text-slate-600 mb-1">
                                by {b.author || "Unknown"}
                              </p>
                              <p className="text-sm text-slate-800 font-medium mb-4">
                                Edition : 1
                              </p>

                              <div className="mb-5">
                                <WileyDetailsButton
                                  onClick={() => onOpenBook(b.id)}
                                />
                              </div>

                              {/* Description */}
                              <div className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                                <p className={expandedDesc[b.id] ? "" : "line-clamp-3"}>
                                  {b.description ||
                                    "Presents a thorough overview of this subject matter, delivering essential insights and structured perspectives for researchers and avid readers."}
                                </p>
                                {b.description && b.description.length > 120 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleDesc(b.id)}
                                    className="text-slate-900 underline text-xs font-bold mt-1 cursor-pointer italic"
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

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6 pb-12 border-t border-black/10">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-9 h-9 flex items-center justify-center rounded-full admin-glass-pill text-[#111214] disabled:opacity-30 hover:bg-white transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setCurrentPage(num)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-colors cursor-pointer ${
                              currentPage === num
                                ? "bg-[#111214] text-[#F5F23B] shadow-md"
                                : "admin-glass-pill text-[#111214] hover:bg-white"
                            }`}
                          >
                            {num}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-9 h-9 flex items-center justify-center rounded-full admin-glass-pill text-[#111214] disabled:opacity-30 hover:bg-white transition-colors cursor-pointer"
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
        <Modal title="All Categories" onClose={() => setShowCategoryModal(false)} wide>
          <div className="flex gap-3 mb-5">
            <button type="button" onClick={() => setSelectedGenres([])} className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#111214] border border-white cursor-pointer">
              Clear Selection
            </button>
            <button type="button" onClick={() => setSelectedGenres(allGenres)} className="px-3.5 py-1.5 rounded-full bg-[#111214] text-[#F5F23B] text-xs font-bold cursor-pointer">
              Select All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 mb-6">
            {allGenres.map((g) => (
              <label key={g} className="flex items-center justify-between group cursor-pointer p-2 rounded-xl bg-white/60 border border-white/80 hover:bg-white/90">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(g)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                      else setSelectedGenres(selectedGenres.filter((x) => x !== g));
                    }}
                    className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-[#111214] truncate" title={g}>{g}</span>
                </div>
                <span className="bg-white text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-slate-200/70">{genreCounts[g] || 0}</span>
              </label>
            ))}
          </div>
          <div className="text-right pt-3 border-t border-black/10">
            <button type="button" onClick={() => setShowCategoryModal(false)} className="bg-[#111214] text-[#F5F23B] px-6 py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer">Done</button>
          </div>
        </Modal>
      )}

      {showAuthorModal && (
        <Modal title="All Authors" onClose={() => setShowAuthorModal(false)} wide>
          <div className="flex gap-3 mb-5">
            <button type="button" onClick={() => setSelectedAuthors([])} className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#111214] border border-white cursor-pointer">
              Clear Selection
            </button>
            <button type="button" onClick={() => setSelectedAuthors(allAuthorsList)} className="px-3.5 py-1.5 rounded-full bg-[#111214] text-[#F5F23B] text-xs font-bold cursor-pointer">
              Select All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 mb-6">
            {allAuthorsList.map((a) => (
              <label key={a} className="flex items-center justify-between group cursor-pointer p-2 rounded-xl bg-white/60 border border-white/80 hover:bg-white/90">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={selectedAuthors.includes(a)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                      else setSelectedAuthors(selectedAuthors.filter((x) => x !== a));
                    }}
                    className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-[#111214] truncate" title={a}>{a}</span>
                </div>
                <span className="bg-white text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-slate-200/70">{authorCounts[a] || 0}</span>
              </label>
            ))}
          </div>
          <div className="text-right pt-3 border-t border-black/10">
            <button type="button" onClick={() => setShowAuthorModal(false)} className="bg-[#111214] text-[#F5F23B] px-6 py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer">Done</button>
          </div>
        </Modal>
      )}

      {showYearModal && (
        <Modal title="All Publication Years" onClose={() => setShowYearModal(false)} wide>
          <div className="flex gap-3 mb-5">
            <button type="button" onClick={() => setSelectedYears([])} className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#111214] border border-white cursor-pointer">
              Clear Selection
            </button>
            <button type="button" onClick={() => setSelectedYears(allYearsList)} className="px-3.5 py-1.5 rounded-full bg-[#111214] text-[#F5F23B] text-xs font-bold cursor-pointer">
              Select All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mb-6">
            {allYearsList.map((y) => (
              <label key={y} className="flex items-center justify-between group cursor-pointer p-2 rounded-xl bg-white/60 border border-white/80 hover:bg-white/90">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(y)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedYears([...selectedYears, y]);
                      else setSelectedYears(selectedYears.filter((x) => x !== y));
                    }}
                    className="brand-check-fallback w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-[#111214] truncate" title={y}>{y}</span>
                </div>
                <span className="bg-white text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ml-2 border border-slate-200/70">{yearCounts[y] || 0}</span>
              </label>
            ))}
          </div>
          <div className="text-right pt-3 border-t border-black/10">
            <button type="button" onClick={() => setShowYearModal(false)} className="bg-[#111214] text-[#F5F23B] px-6 py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer">Done</button>
          </div>
        </Modal>
      )}

      {showStudentModal && (
        <Modal
          title={session.type === "student" ? "Student Workspace Profile" : "Personal Student Profile"}
          onClose={() => setShowStudentModal(false)}
        >
          <div className="space-y-4">
            {/* Department Selection / Context */}
            {Array.isArray(session.departments) && session.departments.length > 1 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Select Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs font-semibold text-[#111214] outline-none"
                >
                  {session.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab switch between Create Profile and Switch Existing */}
            <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold border border-black/5">
              <button
                type="button"
                onClick={() => { setStudentTab("create"); setStudentError(""); }}
                className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer ${
                  studentTab === "create" ? "bg-[#111214] text-[#F5F23B] shadow-xs" : "text-zinc-600 hover:text-black"
                }`}
              >
                + Create Personal Profile
              </button>
              <button
                type="button"
                onClick={() => { setStudentTab("switch"); setStudentError(""); }}
                className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer ${
                  studentTab === "switch" ? "bg-[#111214] text-[#F5F23B] shadow-xs" : "text-zinc-600 hover:text-black"
                }`}
              >
                Switch Student ({activeDeptObj?.students?.length || 0})
              </button>
            </div>

            {studentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {studentError}
              </div>
            )}

            {studentTab === "create" ? (
              <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Creating your personal Student ID allows you to customize your reader with highlights, page lighting, line focus ruler, sticky codes, and study notes that stay saved to your profile.
                </p>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Student Roll No / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-2024-042"
                    value={newStudentRoll}
                    onChange={(e) => setNewStudentRoll(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Personal Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Choose a password to secure your notes"
                    value={newStudentPw}
                    onChange={(e) => setNewStudentPw(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="px-4 py-2 rounded-full border border-black/15 text-xs font-bold text-zinc-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingStudent}
                    className="px-5 py-2 rounded-full bg-[#F5F23B] hover:bg-[#eae729] text-[#111214] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingStudent ? "Creating Profile..." : "Create & Start Reading"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStudentSwitch} className="space-y-3.5">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Switch to your personal student workspace to load your personal highlights and sticky notes.
                </p>

                {(!activeDeptObj?.students || activeDeptObj.students.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-black/5 text-xs text-zinc-500 text-center">
                    No student profiles registered under this department yet. Switch to "Create Personal Profile" tab to register.
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Select Student Profile</label>
                    <select
                      value={switchStudentId}
                      onChange={(e) => setSwitchStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400 mb-3"
                    >
                      <option value="">-- Choose Profile --</option>
                      {activeDeptObj.students.map((stu) => (
                        <option key={stu.id || stu.studentId} value={stu.studentId}>
                          {stu.name} (ID: {stu.studentId})
                        </option>
                      ))}
                    </select>

                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Student Password</label>
                    <input
                      type="password"
                      placeholder="Enter profile password"
                      value={switchStudentPw}
                      onChange={(e) => setSwitchStudentPw(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="px-4 py-2 rounded-full border border-black/15 text-xs font-bold text-zinc-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!switchStudentId}
                    className="px-5 py-2 rounded-full bg-[#111214] text-[#F5F23B] text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Switch Profile
                  </button>
                </div>
              </form>
            )}

            {session.type === "student" && (
              <div className="pt-3 border-t border-black/10 mt-3 flex items-center justify-between bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/90">
                <div>
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-700" /> Switch to Department Login
                  </div>
                  <div className="text-[11px] text-blue-800">
                    Exit personal student profile and return to shared department view.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToDept}
                  className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                >
                  Switch to Dept
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}