import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert, Volume2, VolumeX, 
  ZoomIn, ZoomOut, RotateCcw, ScanSearch, X, Sun, Moon, Highlighter, 
  StickyNote, Bookmark, BookMarked, Maximize, Minimize, Clock, Sliders, 
  Palette, Trash2, Check, Copy, ChevronDown, Sparkles, Code, FileText, 
  Download, Eye, List, BookOpen, Layers, Building2, GripVertical,
  Undo2, Redo2, GraduationCap
} from "lucide-react";
import { palette, fontDisplay, fontBody } from "../theme";
import { supabase } from "../supabaseClient";
import Button from "../components/Button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import BookLoader from "../components/BookLoader";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BASE_PDF_WIDTH = 640;
const MIN_SECTION_ZOOM = 0.75;
const MAX_SECTION_ZOOM = 4.0;
const SECTION_ZOOM_STEP = 0.25;

// Reading Themes Palette
const READING_THEMES = {
  cream: {
    id: "cream",
    name: "Classic Cream",
    pageBg: "#FBF8EE",
    textColor: "#1E293B",
    headerBg: "#132B23",
    outerBg: "#0C1F18",
    toolbarBg: "#16332A",
    accent: "#D97706",
    canvasFilter: "none",
  },
  sepia: {
    id: "sepia",
    name: "Warm Sepia",
    pageBg: "#F4ECD8",
    textColor: "#43302B",
    headerBg: "#2B2118",
    outerBg: "#1C140E",
    toolbarBg: "#33261C",
    accent: "#B45309",
    canvasFilter: "sepia(25%) brightness(98%)",
  },
  midnight: {
    id: "midnight",
    name: "OLED Midnight",
    pageBg: "#111317",
    textColor: "#F1F5F9",
    headerBg: "#090A0D",
    outerBg: "#050608",
    toolbarBg: "#14171E",
    accent: "#F5F23B",
    canvasFilter: "invert(92%) hue-rotate(180deg) contrast(95%)",
  },
  forest: {
    id: "forest",
    name: "Forest Emerald",
    pageBg: "#0E231B",
    textColor: "#ECFDF5",
    headerBg: "#081611",
    outerBg: "#040D0A",
    toolbarBg: "#0D221A",
    accent: "#34D399",
    canvasFilter: "invert(90%) sepia(25%) hue-rotate(95deg) contrast(95%)",
  },
  slate: {
    id: "slate",
    name: "Slate Frosted",
    pageBg: "#1E293B",
    textColor: "#F8FAFC",
    headerBg: "#0F172A",
    outerBg: "#090D16",
    toolbarBg: "#1A2234",
    accent: "#38BDF8",
    canvasFilter: "invert(90%) hue-rotate(190deg) contrast(95%)",
  },
};

// Academic Highlighter Swatches
const HIGHLIGHT_COLORS = {
  yellow: { id: "yellow", name: "Yellow", bg: "rgba(254, 240, 138, 0.48)", border: "#EAB308", text: "#854D0E" },
  lime: { id: "lime", name: "Lime", bg: "rgba(187, 247, 208, 0.48)", border: "#22C55E", text: "#166534" },
  pink: { id: "pink", name: "Pink", bg: "rgba(251, 207, 232, 0.48)", border: "#EC4899", text: "#9D174D" },
  cyan: { id: "cyan", name: "Cyan", bg: "rgba(186, 230, 253, 0.48)", border: "#0EA5E9", text: "#075985" },
  amber: { id: "amber", name: "Amber", bg: "rgba(254, 215, 170, 0.48)", border: "#F97316", text: "#9A3412" },
};

// Interactive Sticky Note Swatches
const STICKY_COLORS = {
  yellow: { id: "yellow", bg: "#FEF9C3", border: "#FDE047", text: "#713F12" },
  green: { id: "green", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
  blue: { id: "blue", bg: "#E0F2FE", border: "#7DD3FC", text: "#0C4A6E" },
  pink: { id: "pink", bg: "#FCE7F3", border: "#F472B6", text: "#831843" },
  purple: { id: "purple", bg: "#F3E8FF", border: "#C084FC", text: "#581C87" },
};

export default function SecureReader({ book, session, onBack, onSaveStudentCustomizations, initialPage = null }) {
  const [page, setPage] = useState(0); // For text pages
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [warning, setWarning] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [jumpInput, setJumpInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [resumedToast, setResumedToast] = useState(null);
  const hasInitializedRef = useRef(false);
  const bookIdRef = useRef(book.id);
  if (bookIdRef.current !== book.id) {
    bookIdRef.current = book.id;
    hasInitializedRef.current = false;
  }

  // Particular Section Zoom state
  const [sectionSelectActive, setSectionSelectActive] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [sectionCrop, setSectionCrop] = useState(null);
  const [sectionZoom, setSectionZoom] = useState(1.5);
  const readerRootRef = useRef(null);
  const pageBoxRef = useRef(null);
  const areaStartRef = useRef(null);

  // Anti-bot reading pace rate limit
  const [paceWarning, setPaceWarning] = useState(false);
  const pageTurnsRef = useRef([]);

  // CDN Signed URLs
  const [cdnPdfUrl, setCdnPdfUrl] = useState(null);
  const [isLoadingPdfUrl, setIsLoadingPdfUrl] = useState(false);

  // ==========================================
  // STUDENT CUSTOMIZATION STATES
  // ==========================================
  const isStudentProfile = session?.type === "student";
  const studentKey = session?.studentId || session?.deptId || session?.id || "anon";
  const [themeKey, setThemeKey] = useState("cream");
  const [brightness, setBrightness] = useState(100); // 50% to 150%
  const [warmLight, setWarmLight] = useState(0); // 0% to 75% eye-care filter
  const [lineFocus, setLineFocus] = useState(false); // Reading ruler mode
  const [lineFocusY, setLineFocusY] = useState(120);

  // Tools & annotations
  const [activeTool, setActiveTool] = useState(null); // null | "highlight" | "sticky"
  const [highlightColor, setHighlightColor] = useState("yellow");
  const [stickyColor, setStickyColor] = useState("yellow");
  const [stickyTag, setStickyTag] = useState("Note"); // "Note" | "Code" | "Formula" | "Exam"
  const [highlights, setHighlights] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  // Toolbars & Side Drawers
  const [showLightControls, setShowLightControls] = useState(false);
  const [showThemeControls, setShowThemeControls] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [notebookTab, setNotebookTab] = useState("notes"); // "notes" | "highlights" | "bookmarks"
  const [copiedToast, setCopiedToast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Annotation Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1);
  const isHistoryActionRef = useRef(false);
  const hasSeededHistoryRef = useRef(false);

  // Dragging & Dropdown refs
  const themeDropdownRef = useRef(null);
  const lightDropdownRef = useRef(null);
  const readingDeskRef = useRef(null);
  const [draggingStickyId, setDraggingStickyId] = useState(null);
  const dragStartPosRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, pageWidth: 640, pageHeight: 800 });

  // Live session reading timer
  const [readingSeconds, setReadingSeconds] = useState(0);

  // EPUB multi-section state
  const isEpub = Boolean(book.epubData || (book.pages && typeof book.pages === 'object' && !Array.isArray(book.pages)));
  const epubData = book.epubData || (book.pages && typeof book.pages === 'object' && !Array.isArray(book.pages) ? book.pages : null);
  const epubSections = useMemo(() => {
    if (!epubData) return [];
    const list = [];
    if (book.coverUrl) list.push({ id: "cover", title: "Cover Page", url: book.coverUrl, type: "image" });
    if (epubData.firstPage?.url) list.push({ id: "firstPage", title: "First Page / Front Matter", url: epubData.firstPage.url, type: "pdf" });
    if (epubData.contentsPage?.url) list.push({ id: "contents", title: "Contents Page", url: epubData.contentsPage.url, type: "pdf" });
    if (Array.isArray(epubData.chapters)) {
      epubData.chapters.forEach((chap, idx) => {
        list.push({
          id: `chap-${idx + 1}`,
          title: chap.title || `Chapter ${chap.number || idx + 1}`,
          url: chap.url || null,
          type: "pdf"
        });
      });
    }
    return list;
  }, [epubData, book.coverUrl]);

  const [activeEpubSectionId, setActiveEpubSectionId] = useState(epubSections[0]?.id || "cover");
  const currentEpubSection = useMemo(() => {
    return epubSections.find(s => s.id === activeEpubSectionId) || epubSections[0] || null;
  }, [epubSections, activeEpubSectionId]);

  // Active reading theme object
  const currentTheme = READING_THEMES[themeKey] || READING_THEMES.cream;

  // Active document URL
  const activeDocumentUrl = isEpub && currentEpubSection?.url ? currentEpubSection.url : (cdnPdfUrl || book.pdfUrl);

  // Load customizations on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`reader_notes_${studentKey}_${book.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.highlights)) setHighlights(parsed.highlights);
        if (Array.isArray(parsed.stickyNotes)) setStickyNotes(parsed.stickyNotes);
        if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
        if (parsed.theme && READING_THEMES[parsed.theme]) setThemeKey(parsed.theme);
        if (typeof parsed.brightness === "number") setBrightness(parsed.brightness);
        if (typeof parsed.warmLight === "number") setWarmLight(parsed.warmLight);
        if (typeof parsed.lineFocus === "boolean") setLineFocus(parsed.lineFocus);
      }
    } catch (_) {}
  }, [studentKey, book.id]);

  // Initialize annotation undo/redo history once initial load completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasSeededHistoryRef.current) {
        hasSeededHistoryRef.current = true;
        setHistory([{ highlights, stickyNotes }]);
        setHistoryIndex(0);
        historyIndexRef.current = 0;
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [highlights, stickyNotes]);

  // Push new annotation state to Undo/Redo history stack
  const pushToHistory = useCallback((nextHighlights, nextStickyNotes) => {
    if (isHistoryActionRef.current) return;
    setHistory((prev) => {
      const curIdx = historyIndexRef.current;
      const baseStack = curIdx >= 0 ? prev.slice(0, curIdx + 1) : prev;
      const nextStack = [...baseStack, { highlights: nextHighlights, stickyNotes: nextStickyNotes }];
      const capped = nextStack.slice(-40);
      const newIdx = capped.length - 1;
      historyIndexRef.current = newIdx;
      setHistoryIndex(newIdx);
      return capped;
    });
  }, []);

  // Undo last highlight or sticky note change
  const handleUndo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    if (curIdx <= 0 || history.length === 0) return;
    const targetIdx = curIdx - 1;
    const targetState = history[targetIdx];
    if (targetState) {
      isHistoryActionRef.current = true;
      historyIndexRef.current = targetIdx;
      setHistoryIndex(targetIdx);
      setHighlights(targetState.highlights || []);
      setStickyNotes(targetState.stickyNotes || []);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 80);
    }
  }, [history]);

  // Redo reverted highlight or sticky note change
  const handleRedo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    if (curIdx < 0 || curIdx >= history.length - 1) return;
    const targetIdx = curIdx + 1;
    const targetState = history[targetIdx];
    if (targetState) {
      isHistoryActionRef.current = true;
      historyIndexRef.current = targetIdx;
      setHistoryIndex(targetIdx);
      setHighlights(targetState.highlights || []);
      setStickyNotes(targetState.stickyNotes || []);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 80);
    }
  }, [history]);

  const totalPages = activeDocumentUrl ? (numPdfPages || book.totalPages || 0) : (book.totalPages || (Array.isArray(book.pages) ? book.pages.length : 1));
  const currentPageDisplay = activeDocumentUrl ? pdfPageNumber : (page + 1);

  // Resume page on mount (ONLY ONCE per book load, and ONLY for Student accounts)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    let targetPage = null;
    let targetSection = null;

    if (session?.type === "student") {
      // 1. Direct explicit initialPage prop from "Continue Reading" button
      if (initialPage && Number(initialPage) >= 1) {
        targetPage = Number(initialPage);
      } else {
        // 2. Check student's DB profile reading progress
        const dbProgress = session?.currentStudent?.customizations?.readingProgress?.[book.id] ||
                           session?.readingProgress?.[book.id];
        if (dbProgress && Number(dbProgress.page) >= 1) {
          targetPage = Number(dbProgress.page);
          targetSection = dbProgress.sectionId;
        } else {
          // 3. Check student local storage progress
          try {
            const raw = localStorage.getItem(`reader_progress_${studentKey}_${book.id}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && Number(parsed.page) >= 1) {
                targetPage = Number(parsed.page);
                targetSection = parsed.sectionId;
              }
            }
          } catch (_) {}

          // 4. Fallback legacy resume key
          if (!targetPage) {
            const legacy = localStorage.getItem(`resume_${book.id}`);
            if (legacy) {
              const p = parseInt(legacy, 10);
              if (!isNaN(p) && p >= 1) targetPage = p;
            }
          }
        }
      }
    }

    if (targetPage && targetPage >= 1) {
      if (activeDocumentUrl) setPdfPageNumber(targetPage);
      else setPage(targetPage - 1);
      
      if (targetSection && epubSections.some(s => s.id === targetSection)) {
        setActiveEpubSectionId(targetSection);
      }

      if (targetPage > 1) {
        setResumedToast({ page: targetPage });
      }
    }
  }, [book.id, Boolean(activeDocumentUrl), session?.type]);

  // Auto-dismiss resumed toast after 5 seconds
  useEffect(() => {
    if (!resumedToast) return;
    const timer = setTimeout(() => {
      setResumedToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [resumedToast]);

  // Save on page turn (ONLY for Student mode)
  useEffect(() => {
    if (!currentPageDisplay) return;
    if (session?.type !== "student") return;

    // Save to legacy key for backward compatibility
    localStorage.setItem(`resume_${book.id}`, currentPageDisplay.toString());

    // Save student-specific progress
    const pct = Math.min(100, Math.max(1, Math.round((currentPageDisplay / Math.max(totalPages || 1, 1)) * 100)));
    const progData = {
      page: currentPageDisplay,
      totalPages: totalPages || 1,
      percent: pct,
      sectionId: activeEpubSectionId,
      lastReadAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(`reader_progress_${studentKey}_${book.id}`, JSON.stringify(progData));

      // Update student recent continue reading list
      const recentKey = `continue_reading_${studentKey}`;
      const list = JSON.parse(localStorage.getItem(recentKey) || "[]");
      const filtered = list.filter(i => i.bookId !== book.id);
      filtered.unshift({ bookId: book.id, ...progData });
      localStorage.setItem(recentKey, JSON.stringify(filtered.slice(0, 15)));
    } catch (_) {}
  }, [currentPageDisplay, activeEpubSectionId, totalPages, book.id, studentKey, session?.type]);

  // Save customizations & reading progress (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const payload = {
          highlights,
          stickyNotes,
          bookmarks,
          theme: themeKey,
          brightness,
          warmLight,
          lineFocus
        };
        localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        if (onSaveStudentCustomizations) {
          const pct = Math.min(100, Math.max(1, Math.round((currentPageDisplay / Math.max(totalPages || 1, 1)) * 100)));
          onSaveStudentCustomizations(
            session?.institutionId || session?.id,
            session?.deptId,
            session?.studentId,
            book.id,
            {
              global: { theme: themeKey, brightness, warmLight, lineFocus },
              book: { highlights, stickyNotes, bookmarks },
              progress: {
                page: currentPageDisplay,
                totalPages: totalPages || 1,
                percent: pct,
                sectionId: activeEpubSectionId,
                lastReadAt: new Date().toISOString()
              }
            }
          );
        }
      } catch (_) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [highlights, stickyNotes, bookmarks, themeKey, brightness, warmLight, lineFocus, studentKey, book.id, onSaveStudentCustomizations, session, currentPageDisplay, totalPages, activeEpubSectionId]);

  // Reset section zoom state when changing page or book
  useEffect(() => {
    setSectionSelectActive(false);
    setSelectionRect(null);
    setSectionCrop(null);
    areaStartRef.current = null;
  }, [book.id, pdfPageNumber, activeEpubSectionId]);

  const clampSectionZoom = useCallback((val) => {
    return Math.min(MAX_SECTION_ZOOM, Math.max(MIN_SECTION_ZOOM, Math.round(val * 4) / 4));
  }, []);

  const handleSectionZoomIn = useCallback(() => {
    setSectionZoom((z) => clampSectionZoom(z + SECTION_ZOOM_STEP));
  }, [clampSectionZoom]);

  const handleSectionZoomOut = useCallback(() => {
    setSectionZoom((z) => clampSectionZoom(z - SECTION_ZOOM_STEP));
  }, [clampSectionZoom]);

  const handleCloseSectionZoom = useCallback(() => {
    setSectionCrop(null);
    setSectionSelectActive(false);
    setSelectionRect(null);
    areaStartRef.current = null;
  }, []);

  // Block wheel zooming in reader container
  useEffect(() => {
    const root = readerRootRef.current;
    if (!root) return;
    const blockWheelZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    root.addEventListener("wheel", blockWheelZoom, { passive: false });
    return () => root.removeEventListener("wheel", blockWheelZoom);
  }, []);

  // Coordinate resolution
  const getSelectionMetrics = (clientX, clientY) => {
    const outer = pageBoxRef.current;
    if (!outer) return null;
    const pageEl = outer.querySelector(".react-pdf__Page") || outer;
    const outerRect = outer.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return null;
    return {
      x: Math.min(pageRect.width, Math.max(0, clientX - pageRect.left)),
      y: Math.min(pageRect.height, Math.max(0, clientY - pageRect.top)),
      pageWidth: pageRect.width,
      pageHeight: pageRect.height,
      offsetX: pageRect.left - outerRect.left,
      offsetY: pageRect.top - outerRect.top,
    };
  };

  // Desk pointerdown: allow dropping sticky notes outside the book in the margins
  const handleDeskPointerDown = (e) => {
    if (activeTool !== "sticky") return;
    if (!pageBoxRef.current) return;
    if (pageBoxRef.current.contains(e.target)) return;

    const pageRect = pageBoxRef.current.getBoundingClientRect();
    const relX = e.clientX - pageRect.left;
    const relY = e.clientY - pageRect.top;

    let placement = "margin-right";
    let xPct = 102;
    const yPct = Math.max(2, Math.min(84, (relY / Math.max(pageRect.height, 1)) * 100));

    if (relX < 0) {
      placement = "margin-left";
      xPct = -32;
    } else {
      placement = "margin-right";
      xPct = 102;
    }

    const newSticky = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageNumber: currentPageDisplay,
      placement,
      x: xPct,
      y: yPct,
      color: stickyColor,
      tag: stickyTag,
      text: "",
      isCollapsed: false,
      author: session?.studentName || session?.name || "Student",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedNotes = [...stickyNotes, newSticky];
    setStickyNotes(updatedNotes);
    pushToHistory(highlights, updatedNotes);
    setActiveTool(null);
  };

  // Pointer interaction: Section Zoom vs Highlighter vs Sticky Note
  const handlePagePointerDown = (e) => {
    if (e.button !== 0) return;
    const pt = getSelectionMetrics(e.clientX, e.clientY);
    if (!pt) return;

    // 1. Sticky Note Tool: drop a sticky note on the book page
    if (activeTool === "sticky") {
      const xPct = Math.max(3, Math.min(68, (pt.x / pt.pageWidth) * 100));
      const yPct = Math.max(2, Math.min(84, (pt.y / pt.pageHeight) * 100));
      const newSticky = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: currentPageDisplay,
        placement: "page",
        x: xPct,
        y: yPct,
        color: stickyColor,
        tag: stickyTag,
        text: "",
        isCollapsed: false,
        author: session?.studentName || session?.name || "Student",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updatedNotes = [...stickyNotes, newSticky];
      setStickyNotes(updatedNotes);
      pushToHistory(highlights, updatedNotes);
      setActiveTool(null);
      return;
    }

    // 2. Section Zoom or Highlighter: start drag box
    if (sectionSelectActive || activeTool === "highlight") {
      areaStartRef.current = pt;
      setSelectionRect({ left: pt.offsetX + pt.x, top: pt.offsetY + pt.y, width: 0, height: 0 });
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
  };

  const handlePagePointerMove = (e) => {
    if (!areaStartRef.current) return;
    const pt = getSelectionMetrics(e.clientX, e.clientY);
    if (!pt) return;
    const start = areaStartRef.current;
    setSelectionRect({
      left: pt.offsetX + Math.min(start.x, pt.x),
      top: pt.offsetY + Math.min(start.y, pt.y),
      width: Math.abs(pt.x - start.x),
      height: Math.abs(pt.y - start.y),
    });
  };

  const handlePagePointerUp = (e) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    if (!areaStartRef.current) return;
    const pt = getSelectionMetrics(e.clientX, e.clientY);
    const start = areaStartRef.current;
    areaStartRef.current = null;
    setSelectionRect(null);

    if (!pt) return;

    const rawLeft = Math.min(start.x, pt.x);
    const rawTop = Math.min(start.y, pt.y);
    const boxW = Math.abs(pt.x - start.x);
    const boxH = Math.abs(pt.y - start.y);

    // If Highlighter tool active: create a highlight region
    if (activeTool === "highlight") {
      let hx, hy, hw, hh;
      if (boxW >= 15 && boxH >= 10) {
        hx = (rawLeft / pt.pageWidth) * 100;
        hy = (rawTop / pt.pageHeight) * 100;
        hw = (boxW / pt.pageWidth) * 100;
        hh = (boxH / pt.pageHeight) * 100;
      } else {
        // Single click: create horizontal line highlight band across line
        hx = 6;
        hy = Math.max(1, ((pt.y - 14) / pt.pageHeight) * 100);
        hw = 88;
        hh = Math.min(5, (28 / pt.pageHeight) * 100);
      }
      const newHl = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: currentPageDisplay,
        x: hx,
        y: hy,
        w: hw,
        h: hh,
        color: highlightColor,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updatedHls = [...highlights, newHl];
      setHighlights(updatedHls);
      pushToHistory(updatedHls, stickyNotes);
      // Note: activeTool remains "highlight" so student can continue highlighting until they toggle off or press Esc!
      return;
    }

    // Section Zoom tool
    if (sectionSelectActive) {
      setSectionSelectActive(false);
      let fx, fy, fw, fh;
      if (boxW >= 18 && boxH >= 18) {
        fx = rawLeft / pt.pageWidth;
        fy = rawTop / pt.pageHeight;
        fw = boxW / pt.pageWidth;
        fh = boxH / pt.pageHeight;
      } else {
        fw = 0.48;
        fh = 0.36;
        const clickFx = pt.x / pt.pageWidth;
        const clickFy = pt.y / pt.pageHeight;
        fx = Math.min(1 - fw, Math.max(0, clickFx - fw / 2));
        fy = Math.min(1 - fh, Math.max(0, clickFy - fh / 2));
      }

      const selW = fw * pt.pageWidth;
      const selH = fh * pt.pageHeight;
      const maxModalW = Math.min((typeof window !== "undefined" ? window.innerWidth : 1024) * 0.84, 780);
      const maxModalH = Math.min((typeof window !== "undefined" ? window.innerHeight : 768) * 0.64, 540);
      const fitScale = Math.min(maxModalW / selW, maxModalH / selH);
      const defaultZoom = clampSectionZoom(Math.min(3.0, Math.max(1.5, fitScale)));

      setSectionZoom(defaultZoom);
      setSectionCrop({
        fx,
        fy,
        fw,
        fh,
        pageWidth: pt.pageWidth,
        pageHeight: pt.pageHeight,
        defaultZoom,
      });
    }
  };

  // CDN Signed URL resolution for PDFs
  useEffect(() => {
    let isMounted = true;
    async function resolveSignedCdnUrl() {
      if (!book.pdfUrl) {
        setCdnPdfUrl(null);
        return;
      }
      try {
        let storagePath = null;
        if (book.pdfUrl.includes("/storage/v1/object/public/pdfs/")) {
          storagePath = book.pdfUrl.split("/storage/v1/object/public/pdfs/")[1]?.split("?")[0];
        } else if (book.pdfUrl.includes("/pdfs/")) {
          storagePath = book.pdfUrl.split("/pdfs/")[1]?.split("?")[0];
        }

        if (storagePath) {
          setIsLoadingPdfUrl(true);
          const decodedPath = decodeURIComponent(storagePath);
          const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(decodedPath, 7200);

          if (!error && data?.signedUrl && isMounted) {
            setCdnPdfUrl(data.signedUrl);
            setIsLoadingPdfUrl(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not generate signed CDN URL, falling back to direct URL:", err);
      }

      if (isMounted) {
        setCdnPdfUrl(book.pdfUrl);
        setIsLoadingPdfUrl(false);
      }
    }

    resolveSignedCdnUrl();
    return () => { isMounted = false; };
  }, [book.pdfUrl]);

  // Telemetry session tracking
  useEffect(() => {
    if (session?.role !== "reader") return;

    let heartbeatInterval;
    async function initSession() {
      try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
        await supabase.from("reading_sessions").delete().lt("last_active", fiveMinsAgo);

        const mySessionId = localStorage.getItem("reader_session_id") || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem("reader_session_id", mySessionId);

        await supabase.from("reading_sessions").upsert({
          id: mySessionId,
          license_id: session.institutionId || session.id,
          book_id: book.id,
          last_active: new Date().toISOString(),
        });

        await supabase.from("book_views").insert([{
          id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          book_id: book.id,
          license_id: session.institutionId || session.id,
          viewed_at: new Date().toISOString(),
        }]);

        heartbeatInterval = setInterval(() => {
          supabase.from("reading_sessions").update({ last_active: new Date().toISOString() }).eq("id", mySessionId);
        }, 45000);
      } catch (err) {
        console.warn("Session tracking non-blocking notice:", err);
      }
    }
    initSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [book.id, session]);

  // Anti-scraping pace check
  const checkPaceLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - 60000;
    const recent = pageTurnsRef.current.filter((t) => t > windowStart);
    const burst = recent.filter((t) => t > now - 4000);

    if (recent.length >= 40 || burst.length >= 7) {
      setPaceWarning(true);
      setTimeout(() => setPaceWarning(false), 5000);
      return false;
    }

    recent.push(now);
    pageTurnsRef.current = recent;
    return true;
  }, []);

  // Sync jump input
  useEffect(() => {
    setJumpInput(currentPageDisplay.toString());
  }, [currentPageDisplay]);

  const handleJump = () => {
    let p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      if (!checkPaceLimit()) return;
      if (activeDocumentUrl) setPdfPageNumber(p);
      else setPage(p - 1);
    } else {
      setJumpInput(currentPageDisplay.toString());
    }
  };

  const next = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (activeDocumentUrl) setPdfPageNumber((p) => Math.min(p + 1, totalPages));
    else setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages, Boolean(activeDocumentUrl), checkPaceLimit]);

  const prev = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (activeDocumentUrl) setPdfPageNumber((p) => Math.max(p - 1, 1));
    else setPage((p) => Math.max(p - 1, 0));
  }, [Boolean(activeDocumentUrl), checkPaceLimit]);

  // Focus lock and screenshot blocker
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", () => {
      setIsFocused(document.visibilityState === "visible");
    });

    const blockContext = (e) => e.preventDefault();
    const blockCopy = (e) => e.preventDefault();

    const applyScreenshotRestrictionAPI = (e) => {
      const key = e.key ? e.key.toLowerCase() : "";
      const isPrintScreen = e.key === "PrintScreen" || key === "printscreen";
      const isMacScreenshot = e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key);

      const blockedCombo =
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && key === "u") ||
        (e.ctrlKey && key === "p") ||
        (e.ctrlKey && key === "s") ||
        isPrintScreen ||
        isMacScreenshot;

      if (blockedCombo) {
        e.preventDefault();
        setWarning(true);
        setIsFocused(false);
        setTimeout(() => setWarning(false), 2500);

        if (isPrintScreen || isMacScreenshot) {
          try {
            navigator.clipboard.writeText("Screenshots are disabled for copyrighted material. Content is securely protected.");
          } catch (_) {}
        }
      }

      const isTyping = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if (e.type === "keydown" && !isTyping) {
        // Annotation Undo (Ctrl+Z / Cmd+Z) & Redo (Ctrl+Y / Cmd+Shift+Z)
        if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
          e.preventDefault();
          handleRedo();
          return;
        }

        if (e.key === "Escape") {
          if (sectionCrop) handleCloseSectionZoom();
          else if (sectionSelectActive) setSectionSelectActive(false);
          else if (activeTool) setActiveTool(null);
          else if (lineFocus) setLineFocus(false);
          else if (showNotebook) setShowNotebook(false);
          else if (showLightControls) setShowLightControls(false);
          else if (showThemeControls) setShowThemeControls(false);
        }
        if (!sectionCrop) {
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") prev();
        }
      }
    };

    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("keydown", applyScreenshotRestrictionAPI);
    document.addEventListener("keyup", applyScreenshotRestrictionAPI);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("keydown", applyScreenshotRestrictionAPI);
      document.removeEventListener("keyup", applyScreenshotRestrictionAPI);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [next, prev, sectionCrop, handleCloseSectionZoom, sectionSelectActive, activeTool, lineFocus, showNotebook, showLightControls, showThemeControls, handleUndo, handleRedo]);

  // Click outside to dismiss dropdowns (Theme, Page Lights)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showThemeControls && themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setShowThemeControls(false);
      }
      if (showLightControls && lightDropdownRef.current && !lightDropdownRef.current.contains(e.target)) {
        setShowLightControls(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showThemeControls, showLightControls]);

  // Window-level smooth pointer tracking for Line Focus reading ruler
  useEffect(() => {
    if (!lineFocus) return;
    const handleLineFocusMove = (e) => {
      if (!pageBoxRef.current) return;
      const rect = pageBoxRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (typeof clientY === "number") {
          const relY = clientY - rect.top;
          setLineFocusY(Math.max(20, Math.min(rect.height - 20, relY)));
        }
      }
    };
    window.addEventListener("pointermove", handleLineFocusMove, { passive: true });
    window.addEventListener("touchmove", handleLineFocusMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleLineFocusMove);
      window.removeEventListener("touchmove", handleLineFocusMove);
    };
  }, [lineFocus]);

  // Drag sticky note listener (inside book or out to margins)
  useEffect(() => {
    if (!draggingStickyId) return;

    const handlePointerMove = (e) => {
      const { mouseX, mouseY, startX, startY, pageWidth, pageHeight } = dragStartPosRef.current;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (typeof clientX !== "number" || typeof clientY !== "number") return;

      const deltaX = ((clientX - mouseX) / pageWidth) * 100;
      const deltaY = ((clientY - mouseY) / pageHeight) * 100;

      const newX = startX + deltaX;
      const newY = Math.max(1, Math.min(84, startY + deltaY));

      let placement = "page";
      if (newX < 0) placement = "margin-left";
      else if (newX > 90) placement = "margin-right";
      else placement = "page";

      setStickyNotes((prev) =>
        prev.map((n) =>
          n.id === draggingStickyId
            ? { ...n, x: newX, y: newY, placement }
            : n
        )
      );
    };

    const handlePointerUp = () => {
      setDraggingStickyId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [draggingStickyId]);

  const startDragSticky = (e, id) => {
    e.stopPropagation();
    const note = stickyNotes.find((n) => n.id === id);
    if (!note || !pageBoxRef.current) return;
    const pageRect = pageBoxRef.current.getBoundingClientRect();
    dragStartPosRef.current = {
      mouseX: e.clientX ?? e.touches?.[0]?.clientX,
      mouseY: e.clientY ?? e.touches?.[0]?.clientY,
      startX: note.x,
      startY: note.y,
      pageWidth: pageRect.width || 640,
      pageHeight: pageRect.height || 800,
    };
    setDraggingStickyId(id);
  };

  const toggleStickyPlacement = (id) => {
    setStickyNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const isOutsideMargin = n.placement === "margin-right" || n.placement === "margin-left" || n.x >= 95 || n.x < 0;
        if (isOutsideMargin) {
          // Move onto book page
          return { ...n, placement: "page", x: 25 };
        } else {
          // Move outside book to right margin
          return { ...n, placement: "margin-right", x: 102 };
        }
      })
    );
  };

  // Mutual Exclusivity Helpers: One active tool/mode turns off all others
  const closeAllPopovers = () => {
    setShowThemeControls(false);
    setShowLightControls(false);
    setShowNotebook(false);
  };

  const toggleThemeControls = () => {
    setShowThemeControls((prev) => {
      if (!prev) {
        setShowLightControls(false);
        setShowNotebook(false);
        setLineFocus(false);
        setActiveTool(null);
        setSectionSelectActive(false);
      }
      return !prev;
    });
  };

  const toggleLightControls = () => {
    setShowLightControls((prev) => {
      if (!prev) {
        setShowThemeControls(false);
        setShowNotebook(false);
        setLineFocus(false);
        setActiveTool(null);
        setSectionSelectActive(false);
      }
      return !prev;
    });
  };

  const toggleLineFocus = () => {
    setLineFocus((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        setActiveTool(null);
        setSectionSelectActive(false);
        closeAllPopovers();
      }
      return nextVal;
    });
  };

  const toggleHighlighter = () => {
    if (activeTool === "highlight") {
      setActiveTool(null);
    } else {
      setActiveTool("highlight");
      setLineFocus(false);
      setSectionSelectActive(false);
      closeAllPopovers();
    }
  };

  const selectHighlightColor = (colId) => {
    setHighlightColor(colId);
    setActiveTool("highlight");
    setLineFocus(false);
    setSectionSelectActive(false);
    closeAllPopovers();
  };

  const toggleStickyTool = () => {
    if (activeTool === "sticky") {
      setActiveTool(null);
    } else {
      setActiveTool("sticky");
      setLineFocus(false);
      setSectionSelectActive(false);
      closeAllPopovers();
    }
  };

  const toggleSectionZoom = () => {
    setSectionSelectActive((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        setActiveTool(null);
        setLineFocus(false);
        closeAllPopovers();
      }
      return nextVal;
    });
  };

  const toggleNotebook = () => {
    setShowNotebook((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        setActiveTool(null);
        setLineFocus(false);
        setSectionSelectActive(false);
        setShowThemeControls(false);
        setShowLightControls(false);
      }
      return nextVal;
    });
  };

  // Annotation helpers
  const toggleBookmark = () => {
    setBookmarks((prev) =>
      prev.includes(currentPageDisplay) ? prev.filter((p) => p !== currentPageDisplay) : [...prev, currentPageDisplay].sort((a, b) => a - b)
    );
  };

  const deleteHighlight = (id) => {
    const updated = highlights.filter((h) => h.id !== id);
    setHighlights(updated);
    pushToHistory(updated, stickyNotes);
  };

  const deleteSticky = (id) => {
    const updated = stickyNotes.filter((n) => n.id !== id);
    setStickyNotes(updated);
    pushToHistory(highlights, updated);
  };

  const toggleCollapseSticky = (id) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isCollapsed: !n.isCollapsed } : n))
    );
  };

  const updateStickyText = (id, text) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text } : n))
    );
  };

  const updateStickyTag = (id, tag) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, tag } : n))
    );
  };

  // 1-Click Study Notes Export to Clipboard
  const handleExportStudyNotes = () => {
    const lines = [
      `==================================================`,
      `STUDY NOTES: ${book.title}`,
      `Author: ${book.author || "Unknown"}`,
      `Student: ${session?.studentName || session?.name || "Student"}`,
      `College / Dept: ${session?.institution || ""}${session?.department ? ` • ${session.department}` : ""}`,
      `Exported: ${new Date().toLocaleString()}`,
      `==================================================\n`,
    ];

    if (bookmarks.length > 0) {
      lines.push(`🔖 BOOKMARKED PAGES: ${bookmarks.join(", ")}\n`);
    }

    if (stickyNotes.length > 0) {
      lines.push(`📝 STICKY NOTES & CODES (${stickyNotes.length}):`);
      stickyNotes
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .forEach((n, i) => {
          lines.push(
            `\n[#${i + 1}] PAGE ${n.pageNumber} • [${n.tag || "Note"}] (${n.createdAt})`
          );
          lines.push(n.text || "(empty note)");
        });
      lines.push("\n");
    }

    if (highlights.length > 0) {
      lines.push(`🖍️ HIGHLIGHTS (${highlights.length}):`);
      highlights
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .forEach((h, i) => {
          lines.push(`• Page ${h.pageNumber} — ${h.color.toUpperCase()} Highlight`);
        });
      lines.push("\n");
    }

    const fullText = lines.join("\n");
    try {
      navigator.clipboard.writeText(fullText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (_) {
      alert("Study notes formatted:\n\n" + fullText);
    }
  };

  // Watermark / Copyright text
  // Format: [Licensed Name] • [Dept Name] • [Date] • [Student Name (Student ID)]
  const licensedName = (session?.institution || session?.name || "LICENSED INSTITUTION").trim().toUpperCase();
  const deptName = (session?.department || session?.deptName || "").trim().toUpperCase();
  const accessDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const studentPart = (isStudentProfile && (session?.studentName || session?.name))
    ? `${(session.studentName || session.name).trim().toUpperCase()}${session?.studentId ? ` (${session.studentId})` : ""}`
    : "";

  const watermarkParts = [licensedName];
  if (deptName) watermarkParts.push(deptName);
  watermarkParts.push(accessDate);
  if (studentPart) watermarkParts.push(studentPart);

  const watermarkText = watermarkParts.join(" • ");

  const isBookmarked = bookmarks.includes(currentPageDisplay);
  const totalNotesCount = stickyNotes.length + highlights.length;
  const readingMinutes = Math.floor(readingSeconds / 60);

  return (
    <div
      ref={readerRootRef}
      className={`min-h-[calc(100vh-64px)] flex flex-col relative transition-colors duration-300 ${
        isFullscreen ? "fixed inset-0 z-[200] h-screen" : ""
      }`}
      style={{ backgroundColor: currentTheme.outerBg }}
    >
      {/* SCREEN BLUR LOCK */}
      {!isFocused && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <ShieldAlert size={48} className="text-white mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Reading Paused</h2>
          <p className="text-gray-300">Click anywhere to resume secure reading.</p>
        </div>
      )}

      {/* COPIED TOAST */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-[120] bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} /> Study notes copied! Ready to paste into assignments.
        </div>
      )}

      {/* RESUMED READING PROGRESS TOAST */}
      {resumedToast && (
        <aside aria-label="Reading progress notification" className="fixed top-16 left-1/2 -translate-x-1/2 z-[130] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#111214]/95 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-white/20 flex items-center gap-3 text-xs font-semibold">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5F23B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5F23B]"></span>
            </span>
            <span>Resumed reading at <strong>Page {resumedToast.page}</strong> where you left off</span>
            <button
              type="button"
              onClick={() => {
                if (activeDocumentUrl) setPdfPageNumber(1);
                else setPage(0);
                setResumedToast(null);
              }}
              className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-[#F5F23B] hover:text-[#111214] text-[11px] font-bold transition-all cursor-pointer"
            >
              Start at Page 1
            </button>
            <button
              type="button"
              onClick={() => setResumedToast(null)}
              className="text-white/60 hover:text-white ml-0.5 cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* TOP BAR: Book details + Quick Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-white/10"
        style={{ backgroundColor: currentTheme.headerBg, color: palette.cream }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} /> Library
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md" style={fontDisplay}>
              {book.title}
            </div>
            <div className="text-[11px] text-white/60 truncate flex items-center gap-2">
              <span>{book.author}</span>
              {session?.department && (
                <>
                  <span>•</span>
                  <span className="text-amber-300 font-semibold">{session.department}</span>
                </>
              )}
              {isStudentProfile && (session?.studentName || session?.name) && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
                    <GraduationCap size={11} className="text-emerald-400" />
                    <span>{session.studentName || session.name}</span>
                    {session?.studentId && <span className="text-emerald-400/80 font-mono text-[9px]">({session.studentId})</span>}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* EPUB / Chapter Selector if book has sections */}
        {isEpub && epubSections.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 font-bold hidden md:inline flex items-center gap-1">
              <Layers size={13} /> Section:
            </span>
            <select
              value={activeEpubSectionId}
              onChange={(e) => {
                setActiveEpubSectionId(e.target.value);
                setPdfPageNumber(1);
                setPage(0);
              }}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/20 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {epubSections.map((s) => (
                <option key={s.id} value={s.id} className="text-black bg-white">
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reading Timer & Audio & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-xs font-bold text-amber-300">
            <Clock size={12} /> {readingMinutes}m read
          </div>

          {!book.pdfUrl && !isEpub && (
            <button
              onClick={toggleReadAloud}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                isPlaying ? "bg-amber-400 text-black font-bold" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isPlaying ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span>{isPlaying ? "Stop" : "Read"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* SECOND ROW: CUSTOMIZATION TOOLBAR (Lights, Line Highlights, Sticky Notes, Themes, Study Notebook) */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-black/20 text-xs font-semibold"
        style={{ backgroundColor: currentTheme.toolbarBg, color: palette.cream }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* THEME SELECTOR BUTTON */}
          <div ref={themeDropdownRef} className="relative">
            <button
              type="button"
              onClick={toggleThemeControls}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            >
              <Palette size={13} />
              <span>Theme: {currentTheme.name}</span>
              <ChevronDown size={12} />
            </button>

            {showThemeControls && (
              <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-2xl bg-[#181a20] border border-white/20 shadow-2xl p-2.5 space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1">Background Themes</div>
                {Object.values(READING_THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeKey(t.id);
                      setShowThemeControls(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left font-semibold transition-colors cursor-pointer ${
                      themeKey === t.id ? "bg-white/20 text-amber-300 font-bold" : "hover:bg-white/10 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: t.pageBg }} />
                      <span>{t.name}</span>
                    </div>
                    {themeKey === t.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PAGE LIGHTS & EYE-CARE WARM LIGHT BUTTON */}
          <div ref={lightDropdownRef} className="relative">
            <button
              type="button"
              onClick={toggleLightControls}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 transition-all cursor-pointer ${
                brightness !== 100 || warmLight > 0 ? "bg-amber-400 text-black font-bold" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Sun size={13} />
              <span>Page Lights</span>
              <ChevronDown size={12} />
            </button>

            {showLightControls && (
              <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl bg-[#181a20] border border-white/20 shadow-2xl p-4 space-y-3.5 text-xs text-white">
                <div className="flex items-center justify-between pb-1 border-b border-white/10 font-bold">
                  <span>Page Light Controls</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBrightness(100);
                      setWarmLight(0);
                    }}
                    className="text-[10px] text-amber-300 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Brightness slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1"><Sun size={12} /> Brightness</span>
                    <span className="font-bold">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="140"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Warm Eye-Care night light */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1 text-amber-300"><Moon size={12} /> Warm Night Light</span>
                    <span className="font-bold">{warmLight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="70"
                    value={warmLight}
                    onChange={(e) => setWarmLight(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Soft amber eye-protection filter for fatigue-free night study.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PERSONAL STUDY TOOLS (ONLY AVAILABLE ON STUDENT PROFILES) */}
          {!isStudentProfile ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-xs text-blue-200">
              <Building2 size={13} className="text-blue-300 shrink-0" />
              <span className="font-semibold">Dept View:</span>
              <span className="text-blue-100 text-[11px] hidden sm:inline">Personal highlights, sticky notes & study notebook locked.</span>
              <button
                type="button"
                onClick={onBack}
                className="px-2.5 py-0.5 rounded-full bg-[#F5F23B] text-black font-bold text-[11px] hover:bg-yellow-300 transition-all cursor-pointer shrink-0"
              >
                Switch to Student ID
              </button>
            </div>
          ) : (
            <>
              {/* LINE FOCUS / READING RULER TOGGLE */}
              <button
                type="button"
                onClick={toggleLineFocus}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 transition-all cursor-pointer ${
                  lineFocus ? "bg-amber-400 text-black font-bold shadow-md ring-2 ring-amber-300" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title="Line Focus / Reading Ruler: Highlights the active line as you read, softly dimming the rest"
              >
                <Sliders size={13} />
                <span>Line Focus {lineFocus ? "ON" : "OFF"}</span>
              </button>

              {/* HIGHLIGHTER TOOL */}
              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15">
                <button
                  type="button"
                  onClick={toggleHighlighter}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTool === "highlight" ? "bg-amber-400 text-black shadow-sm ring-2 ring-amber-300" : "text-white hover:bg-white/10"
                  }`}
                >
                  <Highlighter size={13} />
                  <span>Highlighter {activeTool === "highlight" ? "ON" : ""}</span>
                </button>

                {/* Color swatches */}
                {Object.values(HIGHLIGHT_COLORS).map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => selectHighlightColor(col.id)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      highlightColor === col.id && activeTool === "highlight" ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: col.border }}
                    title={`Highlight in ${col.name}`}
                  />
                ))}
              </div>

              {/* STICKY NOTE / CODE TOOL */}
              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15">
                <button
                  type="button"
                  onClick={toggleStickyTool}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTool === "sticky" ? "bg-[#F5F23B] text-black shadow-sm ring-2 ring-yellow-200" : "text-white hover:bg-white/10"
                  }`}
                  title="Click anywhere on book or in side margins to drop a sticky note or code snippet"
                >
                  <StickyNote size={13} />
                  <span>+ Sticky Note / Code {activeTool === "sticky" ? "ACTIVE" : ""}</span>
                </button>

                <select
                  value={stickyTag}
                  onChange={(e) => setStickyTag(e.target.value)}
                  className="bg-black/40 text-[11px] font-bold text-white px-2 py-0.5 rounded-md outline-none cursor-pointer"
                >
                  <option value="Note">Note</option>
                  <option value="Code">Code</option>
                  <option value="Formula">Formula</option>
                  <option value="Exam">Exam Note</option>
                </select>
              </div>

              {/* UNDO / REDO CONTROLS */}
              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    historyIndex > 0
                      ? "text-white hover:bg-white/15 cursor-pointer"
                      : "text-white/40 cursor-not-allowed opacity-50"
                  }`}
                  title="Undo last annotation (Ctrl+Z / Cmd+Z)"
                >
                  <Undo2 size={13} />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex < 0 || historyIndex >= history.length - 1}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    historyIndex >= 0 && historyIndex < history.length - 1
                      ? "text-white hover:bg-white/15 cursor-pointer"
                      : "text-white/40 cursor-not-allowed opacity-50"
                  }`}
                  title="Redo annotation (Ctrl+Y / Cmd+Shift+Z)"
                >
                  <Redo2 size={13} />
                  <span>Redo</span>
                </button>
              </div>
            </>
          )}

          {/* SECTION ZOOM BUTTON (for PDFs) */}
          {book.pdfUrl && (
            <button
              type="button"
              onClick={toggleSectionZoom}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/15 transition-all cursor-pointer ${
                sectionSelectActive ? "bg-amber-400 text-black font-bold" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <ScanSearch size={13} />
              <span>{sectionSelectActive ? "Selecting..." : "Zoom Section"}</span>
            </button>
          )}
        </div>

        {/* RIGHT GROUP: BOOKMARK + PERSONAL STUDY NOTEBOOK DRAWER TOGGLE */}
        <div className="flex items-center gap-2">
          {isStudentProfile && (
            <>
              <button
                type="button"
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 transition-all cursor-pointer ${
                  isBookmarked ? "bg-amber-400 text-black font-bold" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {isBookmarked ? <BookMarked size={13} /> : <Bookmark size={13} />}
                <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
              </button>

              <button
                type="button"
                onClick={toggleNotebook}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F23B] hover:bg-[#eae729] text-black font-bold shadow-md transition-all cursor-pointer"
              >
                <BookOpen size={13} />
                <span>Study Notebook ({totalNotesCount})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* HELPER BANNER FOR ACTIVE TOOLS */}
      {activeTool === "highlight" && (
        <div className="py-1.5 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-3 shadow-inner">
          <span className="flex items-center gap-1.5">
            <Highlighter size={14} className="animate-pulse" />
            <span>Highlighter is <strong>ACTIVE (Multi-Use)</strong>: Click or drag text to highlight continuously in {HIGHLIGHT_COLORS[highlightColor].name}.</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
          >
            <X size={12} strokeWidth={2.5} /> Done Highlighting
          </button>
        </div>
      )}
      {activeTool === "sticky" && (
        <div className="py-1 px-4 text-center text-xs font-bold bg-[#F5F23B] text-black flex items-center justify-center gap-2">
          <StickyNote size={13} /> Click anywhere ON the book or OUTSIDE in the margins to drop your note. Drag by grip to reposition. Press Esc to cancel.
        </div>
      )}
      {lineFocus && (
        <div className="py-1 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-2">
          <Sliders size={13} /> Line Focus Ruler is ACTIVE: Move your mouse or touch to illuminate reading lines. Click Line Focus or press Esc to exit.
        </div>
      )}
      {sectionSelectActive && book.pdfUrl && (
        <div className="py-1 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-2">
          <ScanSearch size={13} /> Drag a box over any section to zoom into it. Press Esc to cancel.
        </div>
      )}

      {/* SECURITY WARNING */}
      {warning && (
        <div className="flex items-center gap-2 justify-center py-2 text-sm bg-red-700 text-white">
          <ShieldAlert size={15} strokeWidth={1.8} /> That action is disabled while reading.
        </div>
      )}

      {/* PACE WARNING */}
      {paceWarning && (
        <div className="flex items-center gap-2 justify-center py-2 text-xs font-semibold animate-pulse bg-red-800 text-white">
          <ShieldAlert size={14} strokeWidth={2} /> Reading pace limit reached: rapid automated page turning detected. Reading will resume shortly.
        </div>
      )}

      {/* MAIN READING CANVAS VIEWPORT */}
      <div
        ref={readingDeskRef}
        onPointerDown={handleDeskPointerDown}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 md:px-36 overflow-x-auto overflow-y-auto relative min-h-[600px]"
        style={{ backgroundColor: currentTheme.outerBg }}
      >
        <div
          ref={pageBoxRef}
          onPointerDown={handlePagePointerDown}
          onPointerMove={handlePagePointerMove}
          onPointerUp={handlePagePointerUp}
          onPointerCancel={handlePagePointerUp}
          onDragStart={(e) => e.preventDefault()}
          className={`no-select select-none relative rounded-xl shadow-2xl flex flex-col items-center ${
            sectionSelectActive ? "cursor-crosshair" : activeTool === "highlight" ? "cursor-text" : activeTool === "sticky" ? "cursor-copy" : ""
          }`}
          style={{
            backgroundColor: currentTheme.pageBg,
            minHeight: 520,
            width: "100%",
            maxWidth: BASE_PDF_WIDTH + 80,
            overflow: "visible", // CRITICAL: Allows sticky notes in margins & edges to stay completely unclipped
            ...fontBody,
            color: currentTheme.textColor,
            filter: `brightness(${brightness}%)`,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* DOCUMENT CONTENT (BASE LAYER IN NORMAL FLOW) */}
          {isEpub && currentEpubSection?.type === "image" ? (
            <div className="w-full flex items-center justify-center p-6 relative z-0">
              <img
                src={currentEpubSection.url}
                alt={currentEpubSection.title}
                className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain"
              />
            </div>
          ) : activeDocumentUrl ? (
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none relative z-0"
              style={{ filter: currentTheme.canvasFilter }}
            >
              <Document
                file={activeDocumentUrl}
                onLoadSuccess={({ numPages }) => setNumPdfPages(numPages)}
                loading={
                  <div className="py-20 px-8 flex items-center justify-center">
                    <BookLoader
                      book={book}
                      message={isLoadingPdfUrl ? "Establishing secure CDN edge connection..." : "Loading secure document..."}
                      size="md"
                    />
                  </div>
                }
                error={
                  <div className="p-16 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 font-bold text-lg">!</div>
                    <p className="text-red-600 font-semibold mb-1">Unable to load document</p>
                    <p className="text-xs text-gray-500 max-w-sm">Please verify your internet connection or check storage bucket configuration.</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pdfPageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={BASE_PDF_WIDTH}
                  loading={
                    <div className="flex items-center justify-center min-h-[480px] w-full">
                      <BookLoader size="sm" message={`Rendering page ${pdfPageNumber}...`} />
                    </div>
                  }
                />
              </Document>
            </div>
          ) : (
            <div className="relative z-0 whitespace-pre-line leading-relaxed text-[1rem] p-10 w-full max-w-2xl">
              {Array.isArray(book.pages) ? book.pages[page] : "This book has no content pages yet."}
            </div>
          )}

          {/* RENDER HIGHLIGHTS ON THIS PAGE (STUDENT PROFILES ONLY) */}
          {isStudentProfile && highlights
            .filter((h) => h.pageNumber === currentPageDisplay)
            .map((h) => (
              <div
                key={h.id}
                className={`absolute z-20 transition-all rounded-xs ${
                  activeTool === "highlight" ? "pointer-events-none" : "pointer-events-auto group/hl"
                }`}
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: `${h.w}%`,
                  height: `${h.h}%`,
                  backgroundColor: HIGHLIGHT_COLORS[h.color]?.bg || "rgba(254, 240, 138, 0.48)",
                  borderBottom: `2.5px solid ${HIGHLIGHT_COLORS[h.color]?.border || "#EAB308"}`,
                }}
              >
                {activeTool !== "highlight" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHighlight(h.id);
                    }}
                    className="opacity-0 group-hover/hl:opacity-100 absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:scale-110 transition-all cursor-pointer z-30"
                    title="Remove highlight"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}

          {/* INNER CLIPPED CONTAINER FOR WATERMARK & NIGHT LIGHT TO PRESERVE ROUNDED CORNERS */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-30">
            {/* WARM NIGHT EYE-CARE LIGHT FILTER */}
            {warmLight > 0 && (
              <div
                className="absolute inset-0 z-40 transition-opacity"
                style={{
                  backgroundColor: "rgba(255, 160, 20, 0.4)",
                  opacity: warmLight / 100,
                  mixBlendMode: "multiply",
                }}
              />
            )}

            {/* WATERMARK OVERLAY */}
            <div
              className="absolute inset-0 overflow-hidden opacity-[0.08] flex flex-wrap content-start gap-12 p-6 z-30 select-none"
              aria-hidden="true"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="text-xs font-bold tracking-wider whitespace-nowrap" style={{ transform: "rotate(-22deg)", color: currentTheme.textColor }}>
                  {watermarkText}
                </span>
              ))}
            </div>
          </div>

          {/* LINE FOCUS / READING RULER (RENDERED ON TOP OF PDF CANVAS) */}
          {lineFocus && (
            <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden rounded-xl">
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${Math.max(0, lineFocusY - 26)}px`,
                  backgroundColor: "rgba(0,0,0,0.52)",
                  transition: "height 0.02s linear",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.max(0, lineFocusY - 26)}px`,
                  left: 0,
                  right: 0,
                  height: "52px",
                  backgroundColor: "rgba(245, 158, 11, 0.16)",
                  borderTop: "2.5px solid #F59E0B",
                  borderBottom: "2.5px solid #F59E0B",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
                  transition: "top 0.02s linear",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${Math.max(0, lineFocusY + 26)}px`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.52)",
                }}
              />
            </div>
          )}

          {/* ACTIVE DRAG SELECTION RECTANGLE */}
          {selectionRect && (
            <div
              className="pointer-events-none absolute z-45 border-2 border-dashed rounded-xs"
              style={{
                left: selectionRect.left,
                top: selectionRect.top,
                width: selectionRect.width,
                height: selectionRect.height,
                borderColor: activeTool === "highlight" ? HIGHLIGHT_COLORS[highlightColor].border : "#D97706",
                backgroundColor: activeTool === "highlight" ? HIGHLIGHT_COLORS[highlightColor].bg : "rgba(253, 209, 50, 0.25)",
              }}
            />
          )}

          {/* RENDER STICKY NOTES ON THIS PAGE (STUDENT PROFILES ONLY) */}
          {isStudentProfile && stickyNotes
            .filter((n) => n.pageNumber === currentPageDisplay)
            .map((n) => {
              const col = STICKY_COLORS[n.color] || STICKY_COLORS.yellow;
              const isMarginRight = n.placement === "margin-right" || n.x >= 95;
              const isMarginLeft = n.placement === "margin-left" || n.x < 0;
              const isOutsideMargin = isMarginRight || isMarginLeft;

              let styleLeft;
              let styleRight;

              if (isMarginRight) {
                styleLeft = "calc(100% + 14px)";
                styleRight = undefined;
              } else if (isMarginLeft) {
                styleLeft = undefined;
                styleRight = "calc(100% + 14px)";
              } else {
                styleLeft = `${Math.max(2, Math.min(68, n.x))}%`;
                styleRight = undefined;
              }

              return (
                <div
                  key={n.id}
                  className={`absolute z-50 pointer-events-auto shadow-2xl rounded-xl transition-all ${
                    isOutsideMargin ? "ring-2 ring-amber-400/70" : ""
                  }`}
                  style={{
                    left: styleLeft,
                    right: styleRight,
                    top: `${Math.max(1, Math.min(84, n.y))}%`,
                    width: n.isCollapsed ? "auto" : "220px",
                    backgroundColor: col.bg,
                    border: `1.5px solid ${col.border}`,
                    color: col.text,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {n.isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleCollapseSticky(n.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
                      title="Click to expand note"
                    >
                      <span>📌</span>
                      <span className="truncate max-w-[100px]">{n.text || n.tag || "Note"}</span>
                      {isOutsideMargin && <span className="text-[9px] bg-black/10 px-1 rounded">Margin</span>}
                    </button>
                  ) : (
                    <div className="p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-1 pb-1 border-b border-black/10">
                        <div className="flex items-center gap-1">
                          <span
                            onPointerDown={(e) => startDragSticky(e, n.id)}
                            className="cursor-grab active:cursor-grabbing text-black/40 hover:text-black p-0.5"
                            title="Drag to reposition note (inside book or out to margins)"
                          >
                            <GripVertical size={12} />
                          </span>
                          <select
                            value={n.tag}
                            onChange={(e) => updateStickyTag(n.id, e.target.value)}
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 outline-none cursor-pointer"
                          >
                            <option value="Note">Note</option>
                            <option value="Code">Code</option>
                            <option value="Formula">Formula</option>
                            <option value="Exam">Exam Note</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStickyPlacement(n.id)}
                            className="px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 text-[10px] font-bold transition-all cursor-pointer"
                            title={isOutsideMargin ? "Move onto book page" : "Move outside book to margin"}
                          >
                            {isOutsideMargin ? "📖 Onto Page" : "📋 To Margin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCollapseSticky(n.id)}
                            className="p-1 rounded hover:bg-black/10 cursor-pointer"
                            title="Minimize note"
                          >
                            <Minimize size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSticky(n.id)}
                            className="p-1 rounded hover:bg-black/10 text-rose-700 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={n.text}
                        onChange={(e) => updateStickyText(n.id, e.target.value)}
                        placeholder={n.tag === "Code" ? "Paste code snippet here..." : "Type study notes..."}
                        className={`w-full bg-white/80 p-1.5 rounded-lg text-xs outline-none border border-black/10 resize-none ${
                          n.tag === "Code" ? "font-mono text-[11px]" : ""
                        }`}
                      />

                      <div className="flex items-center justify-between text-[10px] text-black/60 pt-0.5">
                        <span className="truncate max-w-[100px]">{n.author}</span>
                        <span className="flex items-center gap-1">
                          {isOutsideMargin ? (
                            <span className="text-[9px] bg-black/10 px-1 py-0.2 rounded font-semibold">Margin</span>
                          ) : (
                            <span className="text-[9px] bg-black/10 px-1 py-0.2 rounded font-semibold">On Page</span>
                          )}
                          <span>{n.createdAt}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* SECTION ZOOM MODAL */}
      {sectionCrop && activeDocumentUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
            style={{ backgroundColor: currentTheme.headerBg }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/15">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <ScanSearch size={16} />
                <span>Section Zoom — Page {pdfPageNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1 border border-white/15 bg-black/30">
                <button
                  type="button"
                  onClick={handleSectionZoomOut}
                  disabled={sectionZoom <= MIN_SECTION_ZOOM}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold hover:bg-white/10 disabled:opacity-35 cursor-pointer"
                  style={{ color: palette.cream }}
                >
                  <ZoomOut size={14} /> Zoom Out
                </button>
                <span className="px-2 text-xs font-bold min-w-[48px] text-center text-amber-300">
                  {Math.round(sectionZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleSectionZoomIn}
                  disabled={sectionZoom >= MAX_SECTION_ZOOM}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold hover:bg-white/10 disabled:opacity-35 cursor-pointer"
                  style={{ color: palette.cream }}
                >
                  <ZoomIn size={14} /> Zoom In
                </button>
                <div className="w-px h-4 bg-white/15 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setSectionZoom(sectionCrop.defaultZoom)}
                  className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
                  style={{ color: palette.cream }}
                  title="Reset zoom"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleCloseSectionZoom}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-white/10 hover:bg-white/20 cursor-pointer text-white"
              >
                <X size={14} /> Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 flex">
              <div
                className="m-auto no-select select-none relative rounded-md shadow-2xl overflow-hidden shrink-0"
                style={{
                  width: Math.max(48, Math.round(sectionCrop.fw * BASE_PDF_WIDTH * sectionZoom)),
                  height: Math.max(48, Math.round(sectionCrop.fh * BASE_PDF_WIDTH * sectionZoom * (sectionCrop.pageHeight / sectionCrop.pageWidth))),
                  backgroundColor: currentTheme.pageBg,
                }}
              >
                <div
                  className="pointer-events-none"
                  style={{
                    position: "absolute",
                    left: -Math.round(sectionCrop.fx * BASE_PDF_WIDTH * sectionZoom),
                    top: -Math.round(sectionCrop.fy * BASE_PDF_WIDTH * sectionZoom * (sectionCrop.pageHeight / sectionCrop.pageWidth)),
                    width: Math.round(BASE_PDF_WIDTH * sectionZoom),
                    height: Math.round(BASE_PDF_WIDTH * sectionZoom * (sectionCrop.pageHeight / sectionCrop.pageWidth)),
                  }}
                >
                  <Document file={activeDocumentUrl} loading={null}>
                    <Page
                      pageNumber={pdfPageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={Math.round(BASE_PDF_WIDTH * sectionZoom)}
                      loading={null}
                    />
                  </Document>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL STUDY NOTEBOOK SLIDE-OUT DRAWER */}
      {showNotebook && (
        <>
          <div
            className="fixed inset-0 z-[125] bg-black/60 backdrop-blur-xs"
            onClick={() => setShowNotebook(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[130] w-full max-w-md bg-[#16181f]/95 backdrop-blur-xl border-l border-white/20 shadow-2xl flex flex-col text-white">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#F5F23B]" />
              <h3 className="font-bold text-sm" style={fontDisplay}>Personal Study Notebook</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowNotebook(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Student Profile Info */}
          <div className="px-4 py-2 bg-black/30 border-b border-white/5 flex items-center justify-between text-xs text-white/70">
            <span>Student: <strong className="text-white">{session?.studentName || session?.name}</strong></span>
            {session?.department && <span className="text-amber-300 font-semibold">{session.department}</span>}
          </div>

          {/* Notebook Navigation Tabs */}
          <div className="flex p-2 gap-1 border-b border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setNotebookTab("notes")}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                notebookTab === "notes" ? "bg-[#F5F23B] text-black shadow-sm" : "hover:bg-white/10 text-white/70"
              }`}
            >
              Sticky Notes ({stickyNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setNotebookTab("highlights")}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                notebookTab === "highlights" ? "bg-[#F5F23B] text-black shadow-sm" : "hover:bg-white/10 text-white/70"
              }`}
            >
              Highlights ({highlights.length})
            </button>
            <button
              type="button"
              onClick={() => setNotebookTab("bookmarks")}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                notebookTab === "bookmarks" ? "bg-[#F5F23B] text-black shadow-sm" : "hover:bg-white/10 text-white/70"
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>
          </div>

          {/* Notebook Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notebookTab === "notes" && (
              <>
                {stickyNotes.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    No sticky notes added yet. Use the "+ Sticky Note / Code" tool to pin notes on any page.
                  </div>
                ) : (
                  stickyNotes
                    .sort((a, b) => a.pageNumber - b.pageNumber)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold text-amber-300">
                            Page {n.pageNumber} • {n.tag || "Note"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (activeDocumentUrl) setPdfPageNumber(n.pageNumber);
                                else setPage(n.pageNumber - 1);
                              }}
                              className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                            >
                              Jump to page
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSticky(n.id)}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className={`text-white/90 whitespace-pre-line ${n.tag === "Code" ? "font-mono bg-black/50 p-2 rounded text-[11px]" : ""}`}>
                          {n.text || "(empty note)"}
                        </p>
                        <div className="text-[10px] text-zinc-400 text-right">
                          {n.createdAt}
                        </div>
                      </div>
                    ))
                )}
              </>
            )}

            {notebookTab === "highlights" && (
              <>
                {highlights.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    No highlights created yet. Select the Highlighter tool to mark textbook pages.
                  </div>
                ) : (
                  highlights
                    .sort((a, b) => a.pageNumber - b.pageNumber)
                    .map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: HIGHLIGHT_COLORS[h.color]?.border || "#EAB308" }}
                          />
                          <span className="font-bold text-white">Page {h.pageNumber}</span>
                          <span className="text-zinc-400 capitalize">({h.color} highlight)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeDocumentUrl) setPdfPageNumber(h.pageNumber);
                              else setPage(h.pageNumber - 1);
                            }}
                            className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                          >
                            Jump
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHighlight(h.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                            title="Delete highlight"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </>
            )}

            {notebookTab === "bookmarks" && (
              <>
                {bookmarks.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    No pages bookmarked yet. Click the "Bookmark" button to save key reading pages.
                  </div>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm}
                      className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Bookmark size={14} className="text-amber-400" />
                        <span>Page {bm}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeDocumentUrl) setPdfPageNumber(bm);
                            else setPage(bm - 1);
                          }}
                          className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                        >
                          Jump
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookmarks((prev) => prev.filter((p) => p !== bm))}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Remove bookmark"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* DRAWER FOOTER: 1-Click Export Study Notes */}
          <div className="p-4 border-t border-white/10 bg-black/30 space-y-2">
            <button
              type="button"
              onClick={handleExportStudyNotes}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F5F23B] hover:bg-[#eae729] text-black font-extrabold text-xs shadow-lg transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <Copy size={14} /> Copy / Export Study Notes
            </button>
            <p className="text-[10px] text-zinc-400 text-center">
              Copies all sticky notes, codes & page references formatted for assignments and revision.
            </p>
          </div>
        </div>
        </>
      )}

      {/* FOOTER CONTROLS: PREVIOUS / NEXT / PAGE JUMP */}
      <div
        className="flex items-center justify-center gap-6 py-3.5 border-t border-white/10 z-20"
        style={{ backgroundColor: currentTheme.headerBg }}
      >
        <Button
          variant="outlineLight"
          size="sm"
          onClick={prev}
          disabled={activeDocumentUrl ? pdfPageNumber === 1 : page === 0}
        >
          <ChevronLeft size={16} strokeWidth={1.8} /> Previous
        </Button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-14 px-2 py-1 text-center text-sm font-bold rounded bg-white text-black outline-none border-2 border-transparent focus:border-amber-400 transition-colors"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onBlur={handleJump}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJump();
            }}
          />
          <span className="text-sm font-semibold text-white/70">
            of {totalPages || "?"}
          </span>
        </div>

        <Button
          variant="brass"
          size="sm"
          onClick={next}
          disabled={activeDocumentUrl ? pdfPageNumber === totalPages : page === totalPages - 1}
        >
          Next <ChevronRight size={16} strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  );
}
