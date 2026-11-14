import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert, Volume2, VolumeX, Volume1,
  ZoomIn, ZoomOut, RotateCcw, ScanSearch, X, Sun, Moon, Highlighter, 
  StickyNote, Bookmark, BookMarked, Maximize, Minimize, Minus, Maximize2, Minimize2, Clock, Sliders, 
  Palette, Trash2, Check, Copy, ChevronDown, Sparkles, Code, FileText, 
  Download, Eye, List, BookOpen, Layers, Building2, GripVertical,
  Undo2, Redo2, GraduationCap, Play, Pause, SkipBack, SkipForward, Square, Headphones,
  PanelLeft, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { palette, fontDisplay, fontBody } from "../theme";
import { BrandEmblem3D, ReaderToolIcon3D } from "../components/AdminGlassIcons";
import { supabase } from "../supabaseClient";
import Button from "../components/Button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import BookLoader from "../components/BookLoader";
import { loadEpubDocument } from "../utils/epubLoader";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BASE_PDF_WIDTH = 640;
const MIN_SECTION_ZOOM = 0.75;
const MAX_SECTION_ZOOM = 4.0;
const SECTION_ZOOM_STEP = 0.25;

// Reading Themes Palette
const READING_THEMES = {
  cleanLight: {
    id: "cleanLight",
    name: "Modern Paper (Image 2 Style)",
    pageBg: "#FFFFFF",
    textColor: "#111827",
    headerBg: "#0F172A",
    outerBg: "#ECEEF2",
    toolbarBg: "#1E293B",
    accent: "#0284C7",
    canvasFilter: "none",
  },
  cream: {
    id: "cream",
    name: "Classic Cream",
    pageBg: "#FAF6EB",
    textColor: "#1A222A",
    headerBg: "#0B1511",
    outerBg: "#0E1814",
    toolbarBg: "#10201A",
    accent: "#D97706",
    canvasFilter: "none",
  },
  sepia: {
    id: "sepia",
    name: "Warm Sepia",
    pageBg: "#F5ECD7",
    textColor: "#3A2B20",
    headerBg: "#1A120B",
    outerBg: "#140E08",
    toolbarBg: "#22170E",
    accent: "#B45309",
    canvasFilter: "sepia(25%) brightness(98%)",
  },
  midnight: {
    id: "midnight",
    name: "OLED Midnight",
    pageBg: "#0E1116",
    textColor: "#F1F5F9",
    headerBg: "#080A0E",
    outerBg: "#040507",
    toolbarBg: "#0D1016",
    accent: "#FBBF24",
    canvasFilter: "invert(92%) hue-rotate(180deg) contrast(95%)",
  },
  forest: {
    id: "forest",
    name: "Forest Emerald",
    pageBg: "#0B1D16",
    textColor: "#ECFDF5",
    headerBg: "#06130E",
    outerBg: "#030A08",
    toolbarBg: "#0A1B14",
    accent: "#34D399",
    canvasFilter: "invert(90%) sepia(25%) hue-rotate(95deg) contrast(95%)",
  },
  slate: {
    id: "slate",
    name: "Slate Frosted",
    pageBg: "#182232",
    textColor: "#F8FAFC",
    headerBg: "#0A1018",
    outerBg: "#070B11",
    toolbarBg: "#0F1824",
    accent: "#38BDF8",
    canvasFilter: "invert(90%) hue-rotate(190deg) contrast(95%)",
  },
};

// EPUB Color Mode Options
const EPUB_COLOR_MODES = [
  { id: "auto", name: "Auto (Match Theme)", desc: "Adapts to reader theme automatically" },
  { id: "publisher", name: "Publisher Original", desc: "Authentic publisher colors (Image 2)" },
  { id: "cleanLight", name: "Modern Paper (Pure White)", desc: "Clean white page with deep black text" },
  { id: "cream", name: "Classic Cream", desc: "Warm relaxing cream palette" },
  { id: "sepia", name: "Warm Sepia", desc: "Vintage book paper tone" },
  { id: "mint", name: "Eye-Care Mint", desc: "Soothing mint green reading palette" },
  { id: "dark", name: "Night Mode (Dark)", desc: "High contrast dark canvas" },
];

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

// ==========================================
// VOICE READER TEXT EXTRACTION HELPERS (100% Free & Client-Side)
// ==========================================
async function extractPdfPageLines(doc, pageNumber) {
  if (!doc) return [];
  try {
    const pageObj = await doc.getPage(pageNumber);
    const textContent = await pageObj.getTextContent();
    if (!textContent || !textContent.items || textContent.items.length === 0) {
      return [];
    }

    const rawItems = textContent.items.filter(
      (it) => it.str && typeof it.str === "string" && it.str.trim().length > 0
    );
    if (rawItems.length === 0) return [];

    // Sort items: top-to-bottom (higher Y to lower Y in PDF viewport), then left-to-right (lower X to higher X)
    rawItems.sort((a, b) => {
      const yA = a.transform ? a.transform[5] : 0;
      const yB = b.transform ? b.transform[5] : 0;
      const yDiff = yB - yA;
      if (Math.abs(yDiff) > 6) {
        return yDiff;
      }
      const xA = a.transform ? a.transform[4] : 0;
      const xB = b.transform ? b.transform[4] : 0;
      return xA - xB;
    });

    const lines = [];
    let currentLine = "";
    let lastY = null;

    for (const item of rawItems) {
      const y = item.transform ? item.transform[5] : 0;
      const str = item.str.trim();
      if (!str) continue;

      if (lastY === null) {
        currentLine = str;
        lastY = y;
      } else if (Math.abs(y - lastY) > 6) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = str;
        lastY = y;
      } else {
        const needsSpace =
          currentLine.length > 0 &&
          !currentLine.endsWith(" ") &&
          !str.startsWith(" ") &&
          !str.match(/^[,.:;?!)]/);
        currentLine += (needsSpace ? " " : "") + str;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    return lines;
  } catch (err) {
    console.warn("PDF line extraction failed:", err);
    return [];
  }
}

function extractEpubLines(html) {
  if (!html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript, svg").forEach((el) => el.remove());

    const blockSelectors = "p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd, pre";
    const blocks = doc.querySelectorAll(blockSelectors);
    const lines = [];

    if (blocks.length > 0) {
      blocks.forEach((b) => {
        const text = b.textContent?.trim().replace(/\s+/g, " ");
        if (text) lines.push(text);
      });
    } else {
      const allText = doc.body.textContent || "";
      allText.split(/\r?\n/).forEach((l) => {
        const trimmed = l.trim().replace(/\s+/g, " ");
        if (trimmed) lines.push(trimmed);
      });
    }
    return lines;
  } catch (err) {
    console.warn("EPUB line extraction failed:", err);
    return [];
  }
}

function convertLinesToSentences(rawLines) {
  if (!rawLines || rawLines.length === 0) return [];
  const joined = rawLines.join(" ").replace(/\s+/g, " ").trim();
  if (!joined) return [];

  const sentences = joined.split(/(?<=[.!?])\s+/);
  const results = [];
  for (let s of sentences) {
    s = s.trim();
    if (!s) continue;
    if (s.length > 220) {
      const clauses = s.split(/(?<=[,;:])\s+/);
      let acc = "";
      for (const c of clauses) {
        if ((acc + " " + c).length > 200 && acc) {
          results.push(acc.trim());
          acc = c;
        } else {
          acc = acc ? `${acc} ${c}` : c;
        }
      }
      if (acc.trim()) results.push(acc.trim());
    } else {
      results.push(s);
    }
  }
  return results;
}

function formatSpeechUnits(lines, mode) {
  if (!lines || lines.length === 0) return [];
  if (mode === "sentence") {
    return convertLinesToSentences(lines);
  }
  return lines.map((l) => l.trim()).filter((l) => l.length > 0);
}

// Curate modern, clear, human-like voices (prioritizing Indian English and clean natural voices)
function getCuratedVoices(allVoices) {
  if (!allVoices || allVoices.length === 0) return [];

  // Exclude legacy robotic joke/novelty synth voices
  const blacklist = [
    "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
    "deranged", "fred", "good news", "hysterical", "junior", "kathy",
    "pipe organ", "princess", "ralph", "trinoids", "whisper", "zarvox", "wobble"
  ];

  const validVoices = allVoices.filter((v) => {
    const nameLower = (v.name || "").toLowerCase();
    const langLower = (v.lang || "").toLowerCase().replace(/_/g, "-");
    if (blacklist.some((bad) => nameLower.includes(bad))) return false;
    return langLower.startsWith("en") || langLower.startsWith("hi");
  });

  const curated = [];
  const seenURIs = new Set();

  function addVoice(v, label) {
    if (!v || seenURIs.has(v.voiceURI)) return;
    seenURIs.add(v.voiceURI);
    curated.push({
      voiceURI: v.voiceURI,
      label,
      voice: v,
    });
  }

  // 1. Indian English / Hindi voices (Priority 1 for Indian readers)
  const indianVoices = validVoices.filter((v) => {
    const l = (v.lang || "").toLowerCase().replace(/_/g, "-");
    const n = (v.name || "").toLowerCase();
    return (
      l.includes("en-in") ||
      l.includes("hi-in") ||
      n.includes("india") ||
      n.includes("rishi") ||
      n.includes("veena") ||
      n.includes("neerja") ||
      n.includes("prabhat") ||
      n.includes("ravi") ||
      n.includes("lekha") ||
      n.includes("heera")
    );
  });

  // Sort Indian voices: natural/online first
  indianVoices.sort((a, b) => {
    const aNat = a.name.toLowerCase().includes("natural") || a.name.toLowerCase().includes("online");
    const bNat = b.name.toLowerCase().includes("natural") || b.name.toLowerCase().includes("online");
    return bNat - aNat;
  });

  indianVoices.forEach((v) => {
    const n = v.name.toLowerCase();
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    const isFemale = n.includes("female") || n.includes("neerja") || n.includes("veena") || n.includes("lekha") || n.includes("heera") || n.includes("swara");
    const isMale = n.includes("male") || n.includes("prabhat") || n.includes("rishi") || n.includes("ravi") || n.includes("madhur");
    const genderTag = isFemale ? "Female - Natural" : isMale ? "Male - Natural" : "Natural Clear";
    const flag = v.lang.toLowerCase().includes("hi") ? "🇮🇳 Hindi" : "🇮🇳 Indian English";
    addVoice(v, `${flag} (${genderTag} • ${clean || "Clear"})`);
  });

  // 2. High Quality US Natural Voices
  const usVoices = validVoices.filter((v) => {
    const l = (v.lang || "").toLowerCase().replace(/_/g, "-");
    return (l.includes("en-us") || l === "en") && !indianVoices.includes(v);
  });

  // US Natural Female (Jenny, Aria, Samantha, Ava, Zira, etc.)
  const usFemale = usVoices.filter((v) => {
    const n = v.name.toLowerCase();
    return (
      n.includes("jenny") ||
      n.includes("aria") ||
      n.includes("samantha") ||
      n.includes("ava") ||
      n.includes("allison") ||
      n.includes("zira") ||
      (n.includes("natural") && n.includes("female")) ||
      (n.includes("google") && !n.includes("male"))
    );
  });
  usFemale.slice(0, 2).forEach((v) => {
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    addVoice(v, `🇺🇸 US English (Natural Female • ${clean || "Jenny"})`);
  });

  // US Natural Male (Guy, Christopher, Alex, David, etc.)
  const usMale = usVoices.filter((v) => {
    const n = v.name.toLowerCase();
    return (
      n.includes("guy") ||
      n.includes("christopher") ||
      n.includes("alex") ||
      n.includes("david") ||
      (n.includes("natural") && n.includes("male")) ||
      (n.includes("google") && n.includes("male"))
    );
  });
  usMale.slice(0, 2).forEach((v) => {
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    addVoice(v, `🇺🇸 US English (Natural Male • ${clean || "Guy"})`);
  });

  // 3. British English (UK BBC / Academic)
  const ukVoices = validVoices.filter((v) => {
    const l = (v.lang || "").toLowerCase().replace(/_/g, "-");
    return l.includes("en-gb") && !indianVoices.includes(v);
  });
  const ukFemale = ukVoices.filter((v) => {
    const n = v.name.toLowerCase();
    return n.includes("sonia") || n.includes("libby") || n.includes("serena") || n.includes("fiona") || n.includes("hazel") || (n.includes("google") && !n.includes("male"));
  });
  ukFemale.slice(0, 1).forEach((v) => {
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    addVoice(v, `🇬🇧 British English (BBC Female • ${clean || "Sonia"})`);
  });

  const ukMale = ukVoices.filter((v) => {
    const n = v.name.toLowerCase();
    return n.includes("ryan") || n.includes("george") || n.includes("daniel") || n.includes("oliver") || (n.includes("google") && n.includes("male"));
  });
  ukMale.slice(0, 1).forEach((v) => {
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    addVoice(v, `🇬🇧 British English (Academic Male • ${clean || "Ryan"})`);
  });

  // 4. Australian / Other Natural English
  const auVoices = validVoices.filter((v) => {
    const l = (v.lang || "").toLowerCase().replace(/_/g, "-");
    const n = v.name.toLowerCase();
    return l.includes("en-au") || l.includes("en-ie") || n.includes("natasha") || n.includes("karen") || n.includes("moira");
  });
  auVoices.slice(0, 1).forEach((v) => {
    const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
    addVoice(v, `🇦🇺 Australian English (Natural • ${clean || "Natasha"})`);
  });

  // 5. Fallback if few voices found
  if (curated.length < 3) {
    validVoices.forEach((v) => {
      if (curated.length >= 8) return;
      const clean = v.name.replace(/Google|Microsoft|Apple|Desktop|Online \(Natural\)|Online/gi, "").trim();
      addVoice(v, `🔊 Natural Voice (${clean || v.lang})`);
    });
  }

  return curated.slice(0, 10);
}

export default function SecureReader({ book, session, onBack, onSaveStudentCustomizations, initialPage = null }) {
  const [page, setPage] = useState(0); // For text pages
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [warning, setWarning] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [jumpInput, setJumpInput] = useState("");
  const [resumedToast, setResumedToast] = useState(null);

  // ==========================================
  // PROFESSIONAL VOICE / READ ALOUD SYSTEM
  // ==========================================
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [isVoiceMinimized, setIsVoiceMinimized] = useState(false);
  const [isVoiceExpanded, setIsVoiceExpanded] = useState(false); // Small compact window by default, expand on click
  const [voicePosition, setVoicePosition] = useState(null); // { x: number, y: number } in px from viewport
  const voiceDragRef = useRef({ isDragging: false });
  const voiceWidgetRef = useRef(null);
  const [voiceRate, setVoiceRate] = useState(1.0); // 0.75, 1.0, 1.25, 1.5
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [curatedVoices, setCuratedVoices] = useState([]);
  const [autoAdvancePage, setAutoAdvancePage] = useState(true);
  const [speechUnitMode, setSpeechUnitMode] = useState("line"); // "line" or "sentence"
  const [pageSpeechUnits, setPageSpeechUnits] = useState([]);
  const [currentSpeechIndex, setCurrentSpeechIndex] = useState(0);
  const [isExtractingText, setIsExtractingText] = useState(false);

  const pdfDocRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const isVoiceActiveRef = useRef(false);
  const isVoicePlayingRef = useRef(false);
  const shouldAutoPlayNextPageRef = useRef(false);
  const speechTimeoutRef = useRef(null);
  const utteranceIdRef = useRef(0);
  const selectedVoiceURIRef = useRef("");
  const voiceRateRef = useRef(1.0);

  isVoiceActiveRef.current = isVoiceActive;
  isVoicePlayingRef.current = isVoicePlaying;
  selectedVoiceURIRef.current = selectedVoiceURI;
  voiceRateRef.current = voiceRate;
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
  const studentKey = isStudentProfile ? (session?.studentId || null) : null;
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

  // Left Navigation Rail state (styled identically to 2nd Admin Dashboard)
  const [railExpanded, setRailExpanded] = useState(() => {
    try {
      return localStorage.getItem("reader_rail_expanded") === "true";
    } catch (e) {
      return false;
    }
  });
  const [railMinimized, setRailMinimized] = useState(() => {
    try {
      return localStorage.getItem("reader_rail_minimized") === "true";
    } catch (e) {
      return false;
    }
  });
  const [activeRailPopover, setActiveRailPopover] = useState(null); // null | 'theme' | 'lights' | 'epubStyle' | 'highlighter' | 'sticky'
  const [popoverAnchorY, setPopoverAnchorY] = useState(120);

  const toggleRailPopover = useCallback((popoverId, e) => {
    setActiveRailPopover((curr) => {
      if (curr === popoverId) return null;
      if (e && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clampedY = Math.max(64, Math.min(window.innerHeight - 380, rect.top - 12));
        setPopoverAnchorY(clampedY);
      }
      return popoverId;
    });
  }, []);

  const toggleRailExpanded = () => {
    setRailExpanded((prev) => {
      const next = !prev;
      try { localStorage.setItem("reader_rail_expanded", String(next)); } catch (e) {}
      return next;
    });
  };

  const toggleRailMinimized = () => {
    setRailMinimized((prev) => {
      const next = !prev;
      try { localStorage.setItem("reader_rail_minimized", String(next)); } catch (e) {}
      return next;
    });
  };

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
  const [dragPosition, setDragPosition] = useState(null);
  const dragStartPosRef = useRef({});

  // Live session reading timer
  const [readingSeconds, setReadingSeconds] = useState(0);

  // Robust resolution for EPUB data
  const resolvedEpubData = useMemo(() => {
    let data = null;
    if (book.pages && typeof book.pages === "object" && !Array.isArray(book.pages) && (book.pages.type === "epub" || book.pages.format === "epub" || book.pages.chapters)) {
      data = book.pages;
    } else if (book.epubData) {
      data = book.epubData;
    } else if (typeof book.pages === "string" && book.pages.includes("epub")) {
      try {
        const parsed = JSON.parse(book.pages);
        if (parsed && typeof parsed === "object") data = parsed;
      } catch (_) {}
    } else if (typeof book.description === "string" && book.description.includes("__EPUB_DATA__:")) {
      try {
        const rawJson = book.description.split("__EPUB_DATA__:")[1].split("__CUSTOM_FILTERS__:")[0].trim();
        data = JSON.parse(rawJson);
      } catch (_) {}
    }

    if (data && book.pages && typeof book.pages === "object" && !Array.isArray(book.pages)) {
      if (book.pages.coverPage?.pageCount && data.coverPage) {
        data.coverPage.pageCount = book.pages.coverPage.pageCount;
      }
      if (book.pages.contentsPage?.pageCount && data.contentsPage) {
        data.contentsPage.pageCount = book.pages.contentsPage.pageCount;
      }
      if (Array.isArray(book.pages.chapters) && Array.isArray(data.chapters)) {
        data.chapters.forEach((c, idx) => {
          if (book.pages.chapters[idx]?.pageCount && !c.pageCount) {
            c.pageCount = book.pages.chapters[idx].pageCount;
          }
        });
      }
    }
    return data;
  }, [book.epubData, book.pages, book.description]);

  const isEpub = Boolean(resolvedEpubData);
  const epubData = resolvedEpubData;

  const epubSections = useMemo(() => {
    if (!epubData) return [];
    const list = [];
    if (book.coverUrl) {
      list.push({ id: "cover", title: "Cover Page", url: book.coverUrl, type: "image", pageCount: epubData.coverPage?.pageCount || 1 });
    }
    if (epubData.firstPage?.url) {
      const url = epubData.firstPage.url;
      const isImg = /\.(png|jpe?g|webp|gif)$/i.test(url);
      const isEpubFile = /\.epub$/i.test(url);
      list.push({
        id: "firstPage",
        title: epubData.firstPage.fileName || "First Page / Front Matter",
        url,
        type: isImg ? "image" : (isEpubFile ? "epub" : "pdf"),
        pageCount: epubData.firstPage.pageCount || 1
      });
    }
    if (epubData.contentsPage?.url) {
      const url = epubData.contentsPage.url;
      const isImg = /\.(png|jpe?g|webp|gif)$/i.test(url);
      const isEpubFile = /\.epub$/i.test(url);
      list.push({
        id: "contents",
        title: epubData.contentsPage.fileName || "Contents Page",
        url,
        type: isImg ? "image" : (isEpubFile ? "epub" : "pdf"),
        pageCount: epubData.contentsPage.pageCount || 12
      });
    }
    if (Array.isArray(epubData.chapters)) {
      epubData.chapters.forEach((chap, idx) => {
        if (!chap.url) return;
        const chapId = chap.id || `chap-${idx + 1}`;
        const isImg = /\.(png|jpe?g|webp|gif)$/i.test(chap.url);
        const isEpubFile = /\.epub$/i.test(chap.url);
        list.push({
          id: chapId,
          title: chap.title || `Chapter ${chap.number || idx + 1}`,
          url: chap.url,
          type: isImg ? "image" : (isEpubFile ? "epub" : "pdf"),
          pageCount: chap.pageCount || null
        });
      });
    }
    return list;
  }, [epubData, book.coverUrl]);

  const [activeEpubSectionId, setActiveEpubSectionId] = useState(epubSections[0]?.id || "cover");
  const targetLocalPageRef = useRef(null);

  const currentSectionIdx = useMemo(() => {
    if (!isEpub || !epubSections.length) return -1;
    const idx = epubSections.findIndex(s => s.id === activeEpubSectionId);
    return idx >= 0 ? idx : 0;
  }, [isEpub, epubSections, activeEpubSectionId]);

  const currentEpubSection = useMemo(() => {
    if (!isEpub || !epubSections.length) return null;
    return (currentSectionIdx >= 0 ? epubSections[currentSectionIdx] : epubSections[0]) || null;
  }, [isEpub, epubSections, currentSectionIdx]);

  // Live unpacked EPUB document states
  const [activeEpubDoc, setActiveEpubDoc] = useState(null);
  const [activeEpubPageHtml, setActiveEpubPageHtml] = useState(null);
  const [epubPageDimensions, setEpubPageDimensions] = useState({ width: 510, height: 680 });
  const [isEpubLoading, setIsEpubLoading] = useState(false);
  const [epubError, setEpubError] = useState(null);
  const epubDocCacheRef = useRef({});

  // EPUB custom color palette state
  const [epubColorMode, setEpubColorMode] = useState(() => {
    try {
      return localStorage.getItem(`epub_color_mode_${studentKey || "default"}`) || "auto";
    } catch (_) {
      return "auto";
    }
  });
  const [showEpubColorMenu, setShowEpubColorMenu] = useState(false);
  const epubColorMenuRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(`epub_color_mode_${studentKey || "default"}`, epubColorMode);
    } catch (_) {}
  }, [epubColorMode, studentKey]);

  // Active reading theme object
  const currentTheme = READING_THEMES[themeKey] || READING_THEMES.cleanLight || READING_THEMES.cream;
  const isDarkDesk = themeKey === "midnight" || themeKey === "pitchDark";

  // Active document URL
  const activeDocumentUrl = isEpub
    ? (currentEpubSection?.type === "pdf" ? currentEpubSection.url : null)
    : (cdnPdfUrl || book.pdfUrl);

  // Load and cache unpacked EPUB chapter whenever section changes
  useEffect(() => {
    if (!isEpub || currentEpubSection?.type !== "epub" || !currentEpubSection.url) {
      setActiveEpubDoc(null);
      setActiveEpubPageHtml(null);
      setIsEpubLoading(false);
      setEpubError(null);
      return;
    }

    let isCancelled = false;
    const secUrl = currentEpubSection.url;

    async function loadSection() {
      setIsEpubLoading(true);
      setEpubError(null);

      try {
        let doc = epubDocCacheRef.current[secUrl];
        if (!doc) {
          doc = await loadEpubDocument(secUrl);
          epubDocCacheRef.current[secUrl] = doc;
        }

        if (isCancelled) return;

        setActiveEpubDoc(doc);
        setNumPdfPages(doc.totalPages);

        const targetP = targetLocalPageRef.current !== null ? targetLocalPageRef.current : (pdfPageNumber || 1);
        targetLocalPageRef.current = null;
        const pNum = Math.min(Math.max(1, targetP), doc.totalPages);
        const pageResult = await doc.getPageHtml(pNum, {
          colorMode: epubColorMode,
          theme: currentTheme
        });

        if (isCancelled) return;

        if (typeof pageResult === "object" && pageResult.html) {
          setActiveEpubPageHtml(pageResult.html);
          if (pageResult.width && pageResult.height) {
            setEpubPageDimensions({ width: pageResult.width, height: pageResult.height });
          }
        } else {
          setActiveEpubPageHtml(pageResult);
        }
        setIsEpubLoading(false);
      } catch (err) {
        console.error("EPUB load error:", err);
        if (!isCancelled) {
          setEpubError(err.message || "Failed to load e-Book section.");
          setIsEpubLoading(false);
        }
      }
    }

    loadSection();

    return () => {
      isCancelled = true;
    };
  }, [isEpub, currentEpubSection?.id, currentEpubSection?.url, currentEpubSection?.type]);

  // Update HTML whenever page, color mode, or theme changes within the unpacked EPUB chapter
  useEffect(() => {
    if (!activeEpubDoc || currentEpubSection?.type !== "epub") return;
    let isCancelled = false;

    async function updatePage() {
      try {
        const pageResult = await activeEpubDoc.getPageHtml(pdfPageNumber, {
          colorMode: epubColorMode,
          theme: currentTheme
        });
        if (isCancelled) return;
        if (typeof pageResult === "object" && pageResult.html) {
          setActiveEpubPageHtml(pageResult.html);
          if (pageResult.width && pageResult.height) {
            setEpubPageDimensions({ width: pageResult.width, height: pageResult.height });
          }
        } else {
          setActiveEpubPageHtml(pageResult);
        }
      } catch (err) {
        console.error("Error rendering EPUB page:", err);
      }
    }

    updatePage();
    return () => {
      isCancelled = true;
    };
  }, [activeEpubDoc, currentEpubSection?.type, pdfPageNumber, epubColorMode, themeKey]);

  // Listen for forwarded pointer moves from EPUB iframe for silky-smooth line focus tracking
  useEffect(() => {
    if (!lineFocus) return;

    const handleIframePointer = (e) => {
      if (e.data?.type === "EPUB_POINTER_MOVE" && pageBoxRef.current) {
        const iframe = pageBoxRef.current.querySelector("iframe");
        if (iframe && typeof e.data?.clientY === "number") {
          const iframeRect = iframe.getBoundingClientRect();
          const pageRect = pageBoxRef.current.getBoundingClientRect();
          const relY = (iframeRect.top - pageRect.top) + e.data.clientY;
          if (!isNaN(relY)) {
            setLineFocusY(Math.max(20, Math.min(pageRect.height - 20, relY)));
          }
        }
      }
    };

    window.addEventListener("message", handleIframePointer);
    return () => {
      window.removeEventListener("message", handleIframePointer);
    };
  }, [lineFocus]);

  // Clean up cached blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(epubDocCacheRef.current).forEach((doc) => {
        if (doc?.cleanup) doc.cleanup();
      });
    };
  }, []);

  // Load customizations on mount or when studentKey / book changes
  const hasLoadedCustomizationsRef = useRef("");

  useEffect(() => {
    if (!isStudentProfile || !studentKey) {
      setHighlights([]);
      setStickyNotes([]);
      setBookmarks([]);
      hasLoadedCustomizationsRef.current = "";
      return;
    }

    const currentKey = `${studentKey}_${book.id}`;
    if (hasLoadedCustomizationsRef.current === currentKey) {
      // Already loaded into memory for this student & book; do not clobber live edits
      return;
    }
    hasLoadedCustomizationsRef.current = currentKey;

    try {
      const saved = localStorage.getItem(`reader_notes_${studentKey}_${book.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHighlights(Array.isArray(parsed.highlights) ? parsed.highlights : []);
        setStickyNotes(Array.isArray(parsed.stickyNotes) ? parsed.stickyNotes : []);
        setBookmarks(Array.isArray(parsed.bookmarks) ? parsed.bookmarks : []);
        if (parsed.theme && READING_THEMES[parsed.theme]) setThemeKey(parsed.theme);
        if (typeof parsed.brightness === "number") setBrightness(parsed.brightness);
        if (typeof parsed.warmLight === "number") setWarmLight(parsed.warmLight);
        if (typeof parsed.lineFocus === "boolean") setLineFocus(parsed.lineFocus);
      } else {
        const dbBookCustom = session?.currentStudent?.customizations?.books?.[book.id];
        if (dbBookCustom) {
          setHighlights(Array.isArray(dbBookCustom.highlights) ? dbBookCustom.highlights : []);
          setStickyNotes(Array.isArray(dbBookCustom.stickyNotes) ? dbBookCustom.stickyNotes : []);
          setBookmarks(Array.isArray(dbBookCustom.bookmarks) ? dbBookCustom.bookmarks : []);
        } else {
          setHighlights([]);
          setStickyNotes([]);
          setBookmarks([]);
        }
      }
    } catch (_) {
      setHighlights([]);
      setStickyNotes([]);
      setBookmarks([]);
    }
  }, [studentKey, book.id, isStudentProfile]);

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

  const sectionRanges = useMemo(() => {
    if (!isEpub || !epubSections.length) return [];

    const bookTotal = Number(book.totalPages) || 0;
    const allExplicit = epubSections.every(s => s.pageCount && Number(s.pageCount) > 0);

    let resolvedCounts = [];
    if (allExplicit) {
      resolvedCounts = epubSections.map(s => Number(s.pageCount));
    } else if (bookTotal > 0) {
      const knownCount = epubSections.reduce((sum, s) => sum + (s.pageCount ? Number(s.pageCount) : (s.type === "image" ? 1 : 0)), 0);
      const unknownSections = epubSections.filter(s => !s.pageCount && s.type !== "image");
      const remainingPages = Math.max(unknownSections.length, bookTotal - knownCount);
      const basePerSection = unknownSections.length > 0 ? Math.floor(remainingPages / unknownSections.length) : 0;
      let remainder = unknownSections.length > 0 ? remainingPages % unknownSections.length : 0;

      resolvedCounts = epubSections.map((s) => {
        if (s.pageCount) return Number(s.pageCount);
        if (s.type === "image") return 1;
        const count = basePerSection + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return Math.max(1, count);
      });
    } else {
      resolvedCounts = epubSections.map(s => s.pageCount ? Number(s.pageCount) : (s.type === "image" ? 1 : 25));
    }

    let acc = 0;
    return epubSections.map((s, idx) => {
      const count = resolvedCounts[idx] || (s.type === "image" ? 1 : 1);
      const start = acc + 1;
      const end = acc + count;
      acc = end;
      return {
        id: s.id,
        title: s.title,
        type: s.type,
        url: s.url,
        start,
        end,
        count,
        index: idx
      };
    });
  }, [isEpub, epubSections, book.totalPages]);

  const globalToLocal = useCallback((gPage) => {
    if (!sectionRanges.length) return { sectionId: null, localPage: 1 };
    const maxEnd = sectionRanges[sectionRanges.length - 1].end;
    const target = Math.max(1, Math.min(gPage, maxEnd));
    const range = sectionRanges.find(r => target >= r.start && target <= r.end) || sectionRanges[0];
    const localPage = target - range.start + 1;
    return { sectionId: range.id, localPage, range };
  }, [sectionRanges]);

  const localToGlobal = useCallback((sectionId, localPage) => {
    if (!sectionRanges.length) return localPage || 1;
    const range = sectionRanges.find(r => r.id === sectionId) || sectionRanges[0];
    if (!range) return localPage || 1;
    const validLocal = Math.max(1, Math.min(range.count, localPage || 1));
    return range.start + validLocal - 1;
  }, [sectionRanges]);

  const totalPages = useMemo(() => {
    if (isEpub) {
      if (sectionRanges.length > 0) {
        return sectionRanges[sectionRanges.length - 1].end;
      }
      return Number(book.totalPages) || 1;
    }
    return activeDocumentUrl
      ? (numPdfPages || Number(book.totalPages) || 1)
      : (Number(book.totalPages) || (Array.isArray(book.pages) ? book.pages.length : 1));
  }, [isEpub, sectionRanges, book.totalPages, activeDocumentUrl, numPdfPages, book.pages]);

  const currentGlobalPage = useMemo(() => {
    if (!isEpub) {
      return activeDocumentUrl ? pdfPageNumber : (page + 1);
    }
    return localToGlobal(activeEpubSectionId, pdfPageNumber);
  }, [isEpub, activeDocumentUrl, pdfPageNumber, page, localToGlobal, activeEpubSectionId]);

  const currentPageDisplay = currentGlobalPage;

  // Disable pagination buttons when at document boundaries
  const isPrevDisabled = useMemo(() => {
    return currentPageDisplay <= 1;
  }, [currentPageDisplay]);

  const isNextDisabled = useMemo(() => {
    return currentPageDisplay >= totalPages;
  }, [currentPageDisplay, totalPages]);

  // Resume page on mount (ONLY ONCE per book load, and ONLY for Student accounts with personal progress)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    let targetPage = null;
    let targetSection = null;

    if (session?.type === "student" && studentKey) {
      // 1. Direct explicit initialPage prop from "Continue Reading" button
      if (initialPage && Number(initialPage) >= 1) {
        targetPage = Number(initialPage);
        try {
          const raw = localStorage.getItem(`reader_progress_${studentKey}_${book.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.sectionId) {
              targetSection = parsed.sectionId;
            }
          }
        } catch (_) {}
      } else {
        // 2. Check this student's DB profile reading progress
        const dbProgress = session?.currentStudent?.customizations?.readingProgress?.[book.id];
        if (dbProgress && Number(dbProgress.page) >= 1) {
          targetPage = Number(dbProgress.page);
          targetSection = dbProgress.sectionId;
        } else {
          // 3. Check this student's local storage progress
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
        }
      }
    }

    if (targetPage && targetPage >= 1) {
      if (isEpub) {
        let resolvedGlobal = targetPage;
        if (targetSection && sectionRanges.length > 0) {
          const range = sectionRanges.find(r => r.id === targetSection);
          if (range && targetPage <= range.count && targetPage < range.start) {
            resolvedGlobal = range.start + targetPage - 1;
          }
        }
        const { sectionId, localPage } = globalToLocal(resolvedGlobal);
        if (sectionId) {
          targetLocalPageRef.current = localPage;
          setActiveEpubSectionId(sectionId);
        }
        setPdfPageNumber(localPage);
        if (resolvedGlobal > 1) {
          setResumedToast({ page: resolvedGlobal });
        }
      } else if (activeDocumentUrl) {
        setPdfPageNumber(targetPage);
        if (targetPage > 1) {
          setResumedToast({ page: targetPage });
        }
      } else {
        setPage(targetPage - 1);
        if (targetPage > 1) {
          setResumedToast({ page: targetPage });
        }
      }
    }
  }, [book.id, Boolean(activeDocumentUrl), isEpub, session?.type, studentKey, initialPage, sectionRanges, globalToLocal]);

  // Auto-dismiss resumed toast after 5 seconds
  useEffect(() => {
    if (!resumedToast) return;
    const timer = setTimeout(() => {
      setResumedToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [resumedToast]);

  // Save on page turn (ONLY for Student mode with isolated student key)
  useEffect(() => {
    if (!currentPageDisplay) return;
    if (session?.type !== "student" || !studentKey) return;

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

  // Save customizations & reading progress (debounced, strictly isolated to active student)
  useEffect(() => {
    if (!isStudentProfile || !studentKey) return;
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
            studentKey,
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
  }, [highlights, stickyNotes, bookmarks, themeKey, brightness, warmLight, lineFocus, studentKey, book.id, onSaveStudentCustomizations, session, currentPageDisplay, totalPages, activeEpubSectionId, isStudentProfile]);

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
    if (e.target.closest('.sticky-note-wrapper') || e.target.closest('button, select, textarea, input')) {
      return;
    }
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

    setStickyNotes((prev) => {
      const updatedNotes = [...prev, newSticky];
      pushToHistory(highlights, updatedNotes);
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updatedNotes,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updatedNotes;
    });
    setActiveTool(null);
  };

  // Pointer interaction: Section Zoom vs Highlighter vs Sticky Note
  const handlePagePointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.sticky-note-wrapper') || e.target.closest('button, select, textarea, input')) {
      return;
    }
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
      setStickyNotes((prev) => {
        const updatedNotes = [...prev, newSticky];
        pushToHistory(highlights, updatedNotes);
        if (isStudentProfile && studentKey) {
          try {
            const payload = {
              highlights,
              stickyNotes: updatedNotes,
              bookmarks,
              theme: themeKey,
              brightness,
              warmLight,
              lineFocus
            };
            localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
          } catch (_) {}
        }
        return updatedNotes;
      });
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
      // Single-use: after highlighting one time, turn highlighter off automatically
      setActiveTool(null);
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

  const goToGlobalPage = useCallback((targetGlobal) => {
    if (!checkPaceLimit()) return;
    const maxP = totalPages || 1;
    const clamped = Math.max(1, Math.min(targetGlobal, maxP));

    if (!isEpub) {
      if (activeDocumentUrl) setPdfPageNumber(clamped);
      else setPage(clamped - 1);
      return;
    }

    const { sectionId, localPage } = globalToLocal(clamped);
    if (sectionId && sectionId !== activeEpubSectionId) {
      targetLocalPageRef.current = localPage;
      setActiveEpubSectionId(sectionId);
    }
    setPdfPageNumber(localPage);
  }, [checkPaceLimit, totalPages, isEpub, activeDocumentUrl, globalToLocal, activeEpubSectionId]);

  const handleJump = () => {
    let p = parseInt(jumpInput, 10);
    const maxP = totalPages || 1;
    if (!isNaN(p) && p >= 1 && p <= maxP) {
      goToGlobalPage(p);
    } else {
      setJumpInput(currentPageDisplay.toString());
    }
  };

  const next = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (currentPageDisplay >= totalPages) return;
    goToGlobalPage(currentPageDisplay + 1);
  }, [checkPaceLimit, currentPageDisplay, totalPages, goToGlobalPage]);

  const prev = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (currentPageDisplay <= 1) return;
    goToGlobalPage(currentPageDisplay - 1);
  }, [checkPaceLimit, currentPageDisplay, goToGlobalPage]);

  // ==========================================
  // VOICE PLAYBACK ENGINE (Line-by-line & Page-by-page)
  // ==========================================
  const closeVoiceReader = useCallback(() => {
    utteranceIdRef.current++;
    isVoiceActiveRef.current = false;
    isVoicePlayingRef.current = false;
    shouldAutoPlayNextPageRef.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    activeUtteranceRef.current = null;
    setIsVoicePlaying(false);
    setIsVoicePaused(false);
    setIsVoiceActive(false);
  }, []);

  const stopVoice = useCallback(() => {
    utteranceIdRef.current++;
    isVoicePlayingRef.current = false;
    shouldAutoPlayNextPageRef.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    activeUtteranceRef.current = null;
    setIsVoicePlaying(false);
    setIsVoicePaused(false);
    setCurrentSpeechIndex(0);
  }, []);

  const handleVoicePageEnd = useCallback(() => {
    if (autoAdvancePage && currentPageDisplay < totalPages) {
      shouldAutoPlayNextPageRef.current = true;
      next();
    } else {
      stopVoice();
    }
  }, [autoAdvancePage, currentPageDisplay, totalPages, next, stopVoice]);

  const speakCurrentUnit = useCallback((unitIndex, unitsList = pageSpeechUnits, overrideVoiceURI = null, overrideRate = null) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    if (!unitsList || unitsList.length === 0) {
      stopVoice();
      return;
    }

    const safeIndex = Math.max(0, Math.min(unitIndex, unitsList.length - 1));
    const textToSpeak = unitsList[safeIndex];

    if (!textToSpeak || !textToSpeak.trim()) {
      if (safeIndex < unitsList.length - 1) {
        setCurrentSpeechIndex(safeIndex + 1);
        speakCurrentUnit(safeIndex + 1, unitsList, overrideVoiceURI, overrideRate);
      } else {
        handleVoicePageEnd();
      }
      return;
    }

    const currentId = ++utteranceIdRef.current;

    try {
      window.speechSynthesis.cancel();
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtteranceRef.current = utterance; // Keep ref to prevent Chrome GC pause bug

    const effectiveRate = overrideRate !== null ? overrideRate : (voiceRateRef.current || voiceRate || 1.0);
    const effectiveVoiceURI = overrideVoiceURI || selectedVoiceURIRef.current || selectedVoiceURI;

    utterance.rate = effectiveRate;
    utterance.pitch = voicePitch;

    if (effectiveVoiceURI && availableVoices.length > 0) {
      const matched = availableVoices.find((v) => v.voiceURI === effectiveVoiceURI);
      if (matched) utterance.voice = matched;
    }

    utterance.onstart = () => {
      if (currentId !== utteranceIdRef.current || !isVoiceActiveRef.current) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
        return;
      }
      isVoicePlayingRef.current = true;
      setIsVoicePlaying(true);
      setIsVoicePaused(false);
    };

    utterance.onend = () => {
      activeUtteranceRef.current = null;
      if (currentId !== utteranceIdRef.current) return;
      if (!isVoiceActiveRef.current || !isVoicePlayingRef.current) return;

      if (safeIndex < unitsList.length - 1) {
        const nextIndex = safeIndex + 1;
        setCurrentSpeechIndex(nextIndex);
        speechTimeoutRef.current = setTimeout(() => {
          if (isVoiceActiveRef.current && isVoicePlayingRef.current && currentId === utteranceIdRef.current) {
            speakCurrentUnit(nextIndex, unitsList);
          }
        }, 150);
      } else {
        handleVoicePageEnd();
      }
    };

    utterance.onerror = (e) => {
      activeUtteranceRef.current = null;
      if (currentId !== utteranceIdRef.current) return;
      if (e.error === "canceled" || e.error === "interrupted") return;
      console.warn("Speech synthesis notice:", e);
      isVoicePlayingRef.current = false;
      setIsVoicePlaying(false);
    };

    isVoicePlayingRef.current = true;
    setIsVoicePlaying(true);
    setIsVoicePaused(false);

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis speak error:", err);
    }
  }, [pageSpeechUnits, voiceRate, voicePitch, selectedVoiceURI, availableVoices, stopVoice, handleVoicePageEnd]);

  const pauseVoice = useCallback(() => {
    utteranceIdRef.current++;
    isVoicePlayingRef.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    activeUtteranceRef.current = null;
    setIsVoicePlaying(false);
    setIsVoicePaused(true);
  }, []);

  const resumeVoice = useCallback(() => {
    isVoicePlayingRef.current = true;
    speakCurrentUnit(currentSpeechIndex, pageSpeechUnits);
  }, [speakCurrentUnit, currentSpeechIndex, pageSpeechUnits]);

  const toggleVoicePlayPause = useCallback(() => {
    if (isVoicePlaying) {
      pauseVoice();
    } else {
      resumeVoice();
    }
  }, [isVoicePlaying, pauseVoice, resumeVoice]);

  const stepPrevLine = useCallback(() => {
    if (currentSpeechIndex > 0) {
      const prevIdx = currentSpeechIndex - 1;
      setCurrentSpeechIndex(prevIdx);
      if (isVoicePlaying || isVoicePaused) {
        speakCurrentUnit(prevIdx, pageSpeechUnits);
      }
    } else if (currentPageDisplay > 1) {
      shouldAutoPlayNextPageRef.current = isVoicePlaying;
      prev();
    }
  }, [currentSpeechIndex, isVoicePlaying, isVoicePaused, speakCurrentUnit, pageSpeechUnits, currentPageDisplay, prev]);

  const stepNextLine = useCallback(() => {
    if (currentSpeechIndex < pageSpeechUnits.length - 1) {
      const nextIdx = currentSpeechIndex + 1;
      setCurrentSpeechIndex(nextIdx);
      if (isVoicePlaying || isVoicePaused) {
        speakCurrentUnit(nextIdx, pageSpeechUnits);
      }
    } else if (currentPageDisplay < totalPages) {
      shouldAutoPlayNextPageRef.current = isVoicePlaying;
      next();
    }
  }, [currentSpeechIndex, pageSpeechUnits.length, isVoicePlaying, isVoicePaused, speakCurrentUnit, pageSpeechUnits, currentPageDisplay, totalPages, next]);

  const handleVoiceChange = useCallback((newVoiceURI) => {
    selectedVoiceURIRef.current = newVoiceURI;
    setSelectedVoiceURI(newVoiceURI);
    // Instant live voice switch:
    if (isVoicePlayingRef.current) {
      speakCurrentUnit(currentSpeechIndex, pageSpeechUnits, newVoiceURI, voiceRateRef.current);
    }
  }, [speakCurrentUnit, currentSpeechIndex, pageSpeechUnits]);

  const handleRateChange = useCallback((newRate) => {
    voiceRateRef.current = newRate;
    setVoiceRate(newRate);
    // Instant live speed switch:
    if (isVoicePlayingRef.current) {
      speakCurrentUnit(currentSpeechIndex, pageSpeechUnits, selectedVoiceURIRef.current, newRate);
    }
  }, [speakCurrentUnit, currentSpeechIndex, pageSpeechUnits]);

  const toggleVoiceReader = useCallback(() => {
    if (isVoiceActive) {
      closeVoiceReader();
    } else {
      isVoiceActiveRef.current = true;
      setIsVoiceActive(true);
      setIsVoiceMinimized(false);
      if (pageSpeechUnits.length > 0) {
        speakCurrentUnit(currentSpeechIndex, pageSpeechUnits);
      } else {
        shouldAutoPlayNextPageRef.current = true;
      }
    }
  }, [isVoiceActive, closeVoiceReader, pageSpeechUnits, speakCurrentUnit, currentSpeechIndex]);

  // Draggable Voice Reader Widget Handlers
  const handleVoiceDragMove = useCallback((e) => {
    if (!voiceDragRef.current.isDragging) return;
    const { startX, startY, initialX, initialY, width, height } = voiceDragRef.current;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    const dx = clientX - startX;
    const dy = clientY - startY;

    const pad = 10;
    const newX = Math.max(pad, Math.min(window.innerWidth - width - pad, initialX + dx));
    const newY = Math.max(pad, Math.min(window.innerHeight - height - pad, initialY + dy));

    setVoicePosition({ x: newX, y: newY });
  }, []);

  const handleVoiceDragEnd = useCallback((e) => {
    if (!voiceDragRef.current.isDragging) return;
    voiceDragRef.current.isDragging = false;
    try {
      if (voiceDragRef.current.capturedEl && voiceDragRef.current.pointerId !== undefined) {
        voiceDragRef.current.capturedEl.releasePointerCapture(voiceDragRef.current.pointerId);
      }
    } catch (_) {}
    window.removeEventListener("pointermove", handleVoiceDragMove);
    window.removeEventListener("pointerup", handleVoiceDragEnd);
    window.removeEventListener("pointercancel", handleVoiceDragEnd);
    window.removeEventListener("touchmove", handleVoiceDragMove);
    window.removeEventListener("touchend", handleVoiceDragEnd);
    window.removeEventListener("touchcancel", handleVoiceDragEnd);
  }, [handleVoiceDragMove]);

  const handleVoiceDragStart = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    if (e.target.closest("button") || e.target.closest("select") || e.target.closest("input")) {
      return;
    }

    const el = voiceWidgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    voiceDragRef.current = {
      isDragging: true,
      capturedEl: e.currentTarget,
      pointerId: e.pointerId,
      startX: clientX,
      startY: clientY,
      initialX: rect.left,
      initialY: rect.top,
      width: rect.width,
      height: rect.height,
    };

    try {
      if (e.pointerId !== undefined && e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (_) {}

    window.addEventListener("pointermove", handleVoiceDragMove, { passive: true });
    window.addEventListener("pointerup", handleVoiceDragEnd, { capture: true });
    window.addEventListener("pointercancel", handleVoiceDragEnd, { capture: true });
    window.addEventListener("touchmove", handleVoiceDragMove, { passive: true });
    window.addEventListener("touchend", handleVoiceDragEnd, { capture: true });
    window.addEventListener("touchcancel", handleVoiceDragEnd, { capture: true });
  }, [handleVoiceDragMove, handleVoiceDragEnd]);

  // Load and cache browser system voices (curated for natural clarity and Indian English)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const populateVoices = () => {
      try {
        const rawVoices = window.speechSynthesis.getVoices() || [];
        if (rawVoices.length > 0) {
          setAvailableVoices(rawVoices);
          const curated = getCuratedVoices(rawVoices);
          setCuratedVoices(curated);

          if (curated.length > 0) {
            const currentValid = curated.some((c) => c.voiceURI === selectedVoiceURIRef.current);
            if (!currentValid || !selectedVoiceURIRef.current) {
              const defaultVoice = curated[0];
              selectedVoiceURIRef.current = defaultVoice.voiceURI;
              setSelectedVoiceURI(defaultVoice.voiceURI);
            }
          }
        }
      } catch (_) {}
    };

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Extract lines whenever the page or document changes
  useEffect(() => {
    let isCancelled = false;

    async function loadPageUnits() {
      setIsExtractingText(true);
      let rawLines = [];

      try {
        if (activeDocumentUrl) {
          let doc = pdfDocRef.current;
          if (!doc && pdfjs) {
            try {
              doc = await pdfjs.getDocument(activeDocumentUrl).promise;
              pdfDocRef.current = doc;
            } catch (_) {}
          }
          if (doc) {
            rawLines = await extractPdfPageLines(doc, pdfPageNumber);
          }
        } else if (isEpub && activeEpubPageHtml) {
          rawLines = extractEpubLines(activeEpubPageHtml);
        } else if (Array.isArray(book.pages) && book.pages[page]) {
          rawLines = (book.pages[page] || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        }
      } catch (err) {
        console.warn("Text extraction failed:", err);
      }

      if (isCancelled) return;

      const units = formatSpeechUnits(rawLines, speechUnitMode);
      setPageSpeechUnits(units);
      setCurrentSpeechIndex(0);
      setIsExtractingText(false);

      if (shouldAutoPlayNextPageRef.current && isVoiceActiveRef.current) {
        shouldAutoPlayNextPageRef.current = false;
        if (units.length > 0) {
          speakCurrentUnit(0, units);
        } else {
          stopVoice();
        }
      }
    }

    loadPageUnits();

    return () => {
      isCancelled = true;
    };
  }, [currentPageDisplay, pdfPageNumber, activeDocumentUrl, isEpub, activeEpubPageHtml, page, book.pages, speechUnitMode]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  // Focus lock and screenshot blocker
  useEffect(() => {
    let blurTimer = null;
    const handleFocus = () => {
      if (blurTimer) clearTimeout(blurTimer);
      setIsFocused(true);
    };

    const handleBlur = () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        // If focus shifted to an iframe inside our reader (the EPUB content),
        // or if document is still visible, ignore blur so clicking on the book never triggers Reading Paused!
        if (
          document.activeElement?.tagName === "IFRAME" ||
          (document.hasFocus && document.hasFocus()) ||
          document.visibilityState === "visible"
        ) {
          setIsFocused(true);
          return;
        }
        setIsFocused(false);
      }, 150);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsFocused(false);
      } else {
        setIsFocused(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

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
          else if (activeRailPopover) setActiveRailPopover(null);
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
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("keydown", applyScreenshotRestrictionAPI);
      document.removeEventListener("keyup", applyScreenshotRestrictionAPI);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [next, prev, sectionCrop, handleCloseSectionZoom, sectionSelectActive, activeTool, lineFocus, showNotebook, showLightControls, showThemeControls, handleUndo, handleRedo]);

  // Click outside to dismiss dropdowns (Theme, Page Lights, EPUB Colors)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showThemeControls && themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setShowThemeControls(false);
      }
      if (showLightControls && lightDropdownRef.current && !lightDropdownRef.current.contains(e.target)) {
        setShowLightControls(false);
      }
      if (showEpubColorMenu && epubColorMenuRef.current && !epubColorMenuRef.current.contains(e.target)) {
        setShowEpubColorMenu(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showThemeControls, showLightControls, showEpubColorMenu]);

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
      const { noteId, offsetX, offsetY, pageLeft, pageTop } = dragStartPosRef.current;
      if (!noteId) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (typeof clientX !== "number" || typeof clientY !== "number") return;

      const pixelX = clientX - pageLeft - offsetX;
      const pixelY = clientY - pageTop - offsetY;

      dragStartPosRef.current.pixelX = pixelX;
      dragStartPosRef.current.pixelY = pixelY;
      setDragPosition({ id: noteId, x: pixelX, y: pixelY });
    };

    const handlePointerUp = () => {
      try {
        if (dragStartPosRef.current.capturedEl && dragStartPosRef.current.pointerId !== undefined) {
          dragStartPosRef.current.capturedEl.releasePointerCapture(dragStartPosRef.current.pointerId);
        }
      } catch (_) {}

      const { noteId, pixelX, pixelY, pageWidth, pageHeight } = dragStartPosRef.current;
      if (!noteId) {
        setDraggingStickyId(null);
        setDragPosition(null);
        return;
      }

      const note = stickyNotes.find((n) => n.id === noteId);
      const isCollapsed = Boolean(note?.isCollapsed);
      const noteWidth = isCollapsed ? 140 : 240;

      let placement = "page";
      let finalX = 25;
      const finalY = Math.max(1, Math.min(84, (pixelY / Math.max(pageHeight, 1)) * 100));

      const rightMarginThreshold = pageWidth - (noteWidth * 0.45);
      const leftMarginThreshold = -(noteWidth * 0.55);

      if (pixelX > rightMarginThreshold) {
        // Dropped into right margin
        placement = "margin-right";
        finalX = 102;
      } else if (pixelX < leftMarginThreshold) {
        // Dropped into left margin
        placement = "margin-left";
        finalX = -32;
      } else {
        // Dropped onto book page - clamp cleanly inside margins so note never straddles the edge
        placement = "page";
        const xPct = (pixelX / Math.max(pageWidth, 1)) * 100;
        const maxSafeXPct = Math.max(10, ((pageWidth - noteWidth - 16) / Math.max(pageWidth, 1)) * 100);
        finalX = Math.max(2, Math.min(maxSafeXPct, xPct));
      }

      setStickyNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === noteId
            ? { ...n, x: finalX, y: finalY, placement }
            : n
        );
        pushToHistory(highlights, updated);
        if (isStudentProfile && studentKey) {
          try {
            const payload = {
              highlights,
              stickyNotes: updated,
              bookmarks,
              theme: themeKey,
              brightness,
              warmLight,
              lineFocus
            };
            localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
          } catch (_) {}
        }
        return updated;
      });

      dragStartPosRef.current = {};
      setDraggingStickyId(null);
      setDragPosition(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });
    window.addEventListener("pointercancel", handlePointerUp, { capture: true });
    window.addEventListener("mouseup", handlePointerUp, { capture: true });
    window.addEventListener("touchend", handlePointerUp, { capture: true });
    window.addEventListener("touchcancel", handlePointerUp, { capture: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp, { capture: true });
      window.removeEventListener("pointercancel", handlePointerUp, { capture: true });
      window.removeEventListener("mouseup", handlePointerUp, { capture: true });
      window.removeEventListener("touchend", handlePointerUp, { capture: true });
      window.removeEventListener("touchcancel", handlePointerUp, { capture: true });
    };
  }, [draggingStickyId, highlights, bookmarks, themeKey, brightness, warmLight, lineFocus, isStudentProfile, studentKey, book.id, stickyNotes, pushToHistory]);

  const startDragSticky = (e, id) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return;
    const noteEl = e.currentTarget.closest('.sticky-note-wrapper');
    if (!noteEl || !pageBoxRef.current) return;
    const noteRect = noteEl.getBoundingClientRect();
    const pageRect = pageBoxRef.current.getBoundingClientRect();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    const offsetX = clientX - noteRect.left;
    const offsetY = clientY - noteRect.top;
    const initX = noteRect.left - pageRect.left;
    const initY = noteRect.top - pageRect.top;

    let pointerId;
    if (e.pointerId !== undefined && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerId = e.pointerId;
      } catch (_) {}
    }

    dragStartPosRef.current = {
      noteId: id,
      offsetX,
      offsetY,
      pageLeft: pageRect.left,
      pageTop: pageRect.top,
      pageWidth: pageRect.width || 640,
      pageHeight: pageRect.height || 800,
      pixelX: initX,
      pixelY: initY,
      capturedEl: e.currentTarget,
      pointerId,
    };
    setDragPosition({ id, x: initX, y: initY });
    setDraggingStickyId(id);
  };

  const toggleStickyPlacement = (id) => {
    setStickyNotes((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== id) return n;
        const isOutsideMargin = n.placement === "margin-right" || n.placement === "margin-left" || n.x >= 92 || n.x < 0;
        if (isOutsideMargin) {
          // Move onto book page
          return { ...n, placement: "page", x: 25 };
        } else {
          // Move outside book to right margin
          return { ...n, placement: "margin-right", x: 102 };
        }
      });
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
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
    setStickyNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      pushToHistory(highlights, updated);
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
  };

  const toggleCollapseSticky = (id) => {
    setStickyNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isCollapsed: !n.isCollapsed } : n));
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
  };

  const updateStickyColor = (id, color) => {
    setStickyNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, color } : n));
      pushToHistory(highlights, updated);
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
  };

  const updateStickyText = (id, text) => {
    setStickyNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, text } : n));
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
  };

  const updateStickyTag = (id, tag) => {
    setStickyNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, tag } : n));
      pushToHistory(highlights, updated);
      if (isStudentProfile && studentKey) {
        try {
          const payload = {
            highlights,
            stickyNotes: updated,
            bookmarks,
            theme: themeKey,
            brightness,
            warmLight,
            lineFocus
          };
          localStorage.setItem(`reader_notes_${studentKey}_${book.id}`, JSON.stringify(payload));
        } catch (_) {}
      }
      return updated;
    });
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
        <div
          onClick={() => setIsFocused(true)}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer select-none"
        >
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
                goToGlobalPage(1);
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
        className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-white/10 backdrop-blur-xl shadow-xs"
        style={{ backgroundColor: currentTheme.headerBg, color: palette.cream }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <ArrowLeft size={14} /> Library
          </button>
          <button
            type="button"
            onClick={toggleRailMinimized}
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 shadow-xs ${
              !railMinimized
                ? "bg-amber-400 text-black border-amber-300 font-bold shadow-amber-400/20"
                : "bg-white/10 hover:bg-white/20 active:scale-95 text-white border-white/15"
            }`}
            title={railMinimized ? "Show Tools Rail" : "Hide Tools Rail"}
          >
            <PanelLeft size={14} />
            <span className="hidden sm:inline">Tools</span>
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold truncate max-w-[220px] sm:max-w-md tracking-tight" style={fontDisplay}>
              {book.title}
            </div>
            <div className="text-[11px] text-white/70 truncate flex items-center gap-2 mt-0.5">
              <span>{book.author}</span>
              {session?.department && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.2 rounded border border-amber-400/20 text-[10px]">
                    {session.department}
                  </span>
                </>
              )}
              {isStudentProfile && (session?.studentName || session?.name) && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-950/70 border border-emerald-500/35 px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                    <GraduationCap size={12} className="text-emerald-400" />
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
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-amber-300 font-bold hidden md:inline-flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
              <Layers size={13} className="text-amber-400" /> Section:
            </span>
            <select
              value={activeEpubSectionId}
              onChange={(e) => {
                const targetSecId = e.target.value;
                const range = sectionRanges.find(r => r.id === targetSecId);
                targetLocalPageRef.current = 1;
                setActiveEpubSectionId(targetSecId);
                setPdfPageNumber(1);
                setPage(0);
                setNumPdfPages(null);
                if (range) {
                  setJumpInput(range.start.toString());
                } else {
                  setJumpInput("1");
                }
              }}
              className="px-3 py-1.5 rounded-xl reader-dropdown-noisy border border-amber-400/40 text-xs font-bold text-amber-300 outline-none cursor-pointer max-w-[170px] sm:max-w-xs truncate shadow-md hover:border-amber-400/80 transition-all"
            >
              {epubSections.map((s, idx) => (
                <option key={s.id} value={s.id} className="text-white bg-[#0f131a]">
                  {idx + 1}. {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reading Timer & Audio & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-xs font-bold text-amber-300 shadow-xs">
            <Clock size={12} className="text-amber-400" /> {readingMinutes}m read
          </div>

          {/* Professional Voice / Listen Aloud Button */}
          <button
            type="button"
            onClick={toggleVoiceReader}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs ${
              isVoiceActive
                ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-amber-400/25 ring-2 ring-amber-400/50 scale-102"
                : "bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15"
            }`}
            title="Listen Aloud / Voice Reader (Line-by-line & Page-by-page)"
          >
            {isVoicePlaying ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <Headphones size={13} className="text-black" />
                <span>Listening</span>
              </span>
            ) : isVoicePaused ? (
              <span className="flex items-center gap-1.5">
                <Volume1 size={13} className="text-amber-300" />
                <span>Paused</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Headphones size={13} />
                <span>Voice Reader</span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all cursor-pointer shadow-xs"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>



      {/* HELPER BANNER FOR ACTIVE TOOLS */}
      {activeTool === "highlight" && (
        <div className="py-1.5 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-3 shadow-md animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <Highlighter size={13} className="animate-pulse" />
            <span>Highlighter is <strong>ACTIVE</strong>: Click or drag text to highlight in {HIGHLIGHT_COLORS[highlightColor].name}. (Turns off after highlighting)</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <X size={12} strokeWidth={2.5} /> Cancel
          </button>
        </div>
      )}
      {activeTool === "sticky" && (
        <div className="py-1.5 px-4 text-center text-xs font-bold bg-[#F5F23B] text-black flex items-center justify-center gap-3 shadow-md animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <StickyNote size={13} />
            <span>Click anywhere ON the book or OUTSIDE in the margins to drop your note.</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <X size={12} strokeWidth={2.5} /> Cancel
          </button>
        </div>
      )}
      {lineFocus && (
        <div className="py-1.5 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-3 shadow-md animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <Sliders size={13} />
            <span>Line Focus Ruler is <strong>ACTIVE</strong>: Move your mouse or touch to illuminate reading lines.</span>
          </span>
          <button
            type="button"
            onClick={() => setLineFocus(false)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <X size={12} strokeWidth={2.5} /> Exit Line Focus
          </button>
        </div>
      )}
      {sectionSelectActive && book.pdfUrl && (
        <div className="py-1.5 px-4 text-center text-xs font-bold bg-amber-400 text-black flex items-center justify-center gap-3 shadow-md animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <ScanSearch size={13} />
            <span>Drag a box over any section to zoom into it.</span>
          </span>
          <button
            type="button"
            onClick={() => setSectionSelectActive(false)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <X size={12} strokeWidth={2.5} /> Cancel
          </button>
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

      {/* READER BODY: LEFT GLASS NAVIGATION RAIL + READING DESK */}
      <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
        {/* LEFT GLASS NAVIGATION RAIL (Styled identical to 2nd Admin Dashboard) */}
        {!railMinimized && (
          <aside
            aria-label="Reader navigation rail"
            className={`relative z-40 hidden sm:flex flex-col justify-between shrink-0 my-3 ml-3 py-3 px-2 rounded-2xl transition-all duration-300 select-none ${
              railExpanded ? "w-56" : "w-[68px]"
            } ${
              isDarkDesk
                ? "bg-slate-900/95 border border-white/15 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl text-white"
                : "bg-slate-100/85 border border-white/80 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl text-[#111214]"
            }`}
            style={{
              backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.95)" : "rgba(241, 245, 249, 0.88)",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Header: Brand Emblem + Title */}
              <div className={`w-full flex items-center ${railExpanded ? "justify-between px-2" : "justify-center"} pt-1 pb-1`}>
                <div className="flex items-center gap-2.5">
                  <BrandEmblem3D size={28} />
                  {railExpanded && (
                    <span
                      className={`font-bold text-sm tracking-tight truncate ${
                        isDarkDesk ? "text-white" : "text-[#111214]"
                      }`}
                      style={fontDisplay}
                    >
                      Reader Tools
                    </span>
                  )}
                </div>
                {railExpanded && (
                  <button
                    type="button"
                    onClick={toggleRailMinimized}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isDarkDesk
                        ? "hover:bg-white/10 text-white/50 hover:text-white"
                        : "hover:bg-black/5 text-zinc-500 hover:text-[#111214]"
                    }`}
                    title="Minimize Tools"
                  >
                    <PanelLeftClose size={15} />
                  </button>
                )}
              </div>

              {/* Navigation Tabs List */}
              <nav role="tablist" aria-label="Reader tools" className="w-full flex flex-col gap-1.5">
                {/* 1. THEME SELECTOR */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={(e) => toggleRailPopover("theme", e)}
                    title={`Theme: ${currentTheme.name}`}
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      activeRailPopover === "theme"
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {activeRailPopover === "theme" && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <ReaderToolIcon3D id="theme" active={activeRailPopover === "theme"} size={22} />
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${activeRailPopover === "theme" ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>Theme</span>
                        <span
                          className="ml-auto w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs shrink-0"
                          style={{ backgroundColor: currentTheme.pageBg }}
                          title={currentTheme.name}
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/40"
                          style={{ backgroundColor: currentTheme.pageBg }}
                        />
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          Theme: {currentTheme.name}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. PAGE LIGHTS & WARM EYE-CARE */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={(e) => toggleRailPopover("lights", e)}
                    title={`Page Lights (${brightness}% Brightness, ${warmLight}% Warm Night Light)`}
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      activeRailPopover === "lights" || brightness !== 100 || warmLight > 0
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {(activeRailPopover === "lights" || brightness !== 100 || warmLight > 0) && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <ReaderToolIcon3D id="lights" active={activeRailPopover === "lights" || brightness !== 100 || warmLight > 0} size={22} />
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${
                          activeRailPopover === "lights" || brightness !== 100 || warmLight > 0
                            ? "text-[#111214]"
                            : isDarkDesk ? "text-white/90" : "text-[#111214]"
                        }`}>Page Lights</span>
                        {(brightness !== 100 || warmLight > 0) && (
                          <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/10 text-[#111214]">
                            {brightness}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                        Page Lights ({brightness}%)
                      </span>
                    )}
                  </button>
                </div>

                {/* 3. EPUB COLOR / STYLE (if EPUB) */}
                {isEpub && (
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={(e) => toggleRailPopover("epubStyle", e)}
                      title="e-Book Style"
                      className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                        railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                      } ${
                        activeRailPopover === "epubStyle" || epubColorMode !== "auto"
                          ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                          : isDarkDesk
                            ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                            : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                      }`}
                    >
                      {(activeRailPopover === "epubStyle" || epubColorMode !== "auto") && (
                        <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                        <ReaderToolIcon3D id="epubStyle" active={activeRailPopover === "epubStyle" || epubColorMode !== "auto"} size={22} />
                      </span>
                      {railExpanded ? (
                        <>
                          <span className={`text-xs font-bold truncate ${
                            activeRailPopover === "epubStyle" || epubColorMode !== "auto"
                              ? "text-[#111214]"
                              : isDarkDesk ? "text-white/90" : "text-[#111214]"
                          }`}>e-Book Style</span>
                          <span className="ml-auto text-[10px] font-extrabold capitalize opacity-70">
                            {epubColorMode}
                          </span>
                        </>
                      ) : (
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          e-Book Style: {epubColorMode}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 4. VOICE READER */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={toggleVoiceReader}
                    title="Voice Reader (Listen Aloud Line-by-Line & Page-by-Page)"
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      isVoiceActive
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {isVoiceActive && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 relative">
                      <ReaderToolIcon3D id="voice" active={isVoiceActive} size={22} />
                      {isVoicePlaying && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${isVoiceActive ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>Voice Reader</span>
                        {isVoicePlaying ? (
                          <span className="ml-auto text-[10px] font-black text-emerald-950 bg-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            Live
                          </span>
                        ) : isVoicePaused ? (
                          <span className="ml-auto text-[10px] font-bold text-black/70 bg-black/10 px-1.5 py-0.5 rounded">
                            Paused
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                        Voice Reader {isVoicePlaying ? "(Playing)" : isVoicePaused ? "(Paused)" : ""}
                      </span>
                    )}
                  </button>
                </div>

                {/* 5. LINE FOCUS */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={toggleLineFocus}
                    title="Line Focus Ruler (Illuminates reading lines)"
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      lineFocus
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {lineFocus && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <ReaderToolIcon3D id="lineFocus" active={lineFocus} size={22} />
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${lineFocus ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>Line Focus</span>
                        <span className={`ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          lineFocus ? "bg-[#111214] text-white" : isDarkDesk ? "bg-white/10 text-white/50" : "bg-black/5 text-zinc-500"
                        }`}>
                          {lineFocus ? "ON" : "OFF"}
                        </span>
                      </>
                    ) : (
                      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                        Line Focus: {lineFocus ? "ON" : "OFF"}
                      </span>
                    )}
                  </button>
                </div>

                {/* 6. HIGHLIGHTER */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (activeTool === "highlight") {
                        setActiveTool(null);
                        setActiveRailPopover(null);
                      } else {
                        toggleRailPopover("highlighter", e);
                      }
                    }}
                    title={`Highlighter (${HIGHLIGHT_COLORS[highlightColor].name})`}
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      activeTool === "highlight" || activeRailPopover === "highlighter"
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {(activeTool === "highlight" || activeRailPopover === "highlighter") && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <ReaderToolIcon3D id="highlighter" active={activeTool === "highlight" || activeRailPopover === "highlighter"} size={22} />
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${
                          activeTool === "highlight" || activeRailPopover === "highlighter"
                            ? "text-[#111214]"
                            : isDarkDesk ? "text-white/90" : "text-[#111214]"
                        }`}>Highlighter</span>
                        <span
                          className="ml-auto w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs shrink-0"
                          style={{ backgroundColor: HIGHLIGHT_COLORS[highlightColor].border }}
                          title={HIGHLIGHT_COLORS[highlightColor].name}
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/40"
                          style={{ backgroundColor: HIGHLIGHT_COLORS[highlightColor].border }}
                        />
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          Highlighter {activeTool === "highlight" ? "(Active)" : `(${HIGHLIGHT_COLORS[highlightColor].name})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* 7. STICKY NOTE */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (activeTool === "sticky") {
                        setActiveTool(null);
                        setActiveRailPopover(null);
                      } else {
                        toggleRailPopover("sticky", e);
                      }
                    }}
                    title={`Sticky Note (${STICKY_COLORS[stickyColor].label})`}
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      activeTool === "sticky" || activeRailPopover === "sticky"
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : isDarkDesk
                          ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                          : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {(activeTool === "sticky" || activeRailPopover === "sticky") && (
                      <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                    )}
                    <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <ReaderToolIcon3D id="sticky" active={activeTool === "sticky" || activeRailPopover === "sticky"} size={22} />
                    </span>
                    {railExpanded ? (
                      <>
                        <span className={`text-xs font-bold truncate ${
                          activeTool === "sticky" || activeRailPopover === "sticky"
                            ? "text-[#111214]"
                            : isDarkDesk ? "text-white/90" : "text-[#111214]"
                        }`}>+ Sticky Note</span>
                        <span
                          className="ml-auto w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs shrink-0"
                          style={{ backgroundColor: STICKY_COLORS[stickyColor].border }}
                          title={STICKY_COLORS[stickyColor].label}
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/40"
                          style={{ backgroundColor: STICKY_COLORS[stickyColor].border }}
                        />
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          + Sticky Note {activeTool === "sticky" ? "(Active)" : ""}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* 8. STUDY NOTEBOOK */}
                {isStudentProfile && (
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={toggleNotebook}
                      title={`Study Notebook (${totalNotesCount} notes & highlights)`}
                      className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                        railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                      } ${
                        showNotebook
                          ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                          : isDarkDesk
                            ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                            : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                      }`}
                    >
                      {showNotebook && (
                        <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                        <ReaderToolIcon3D id="notebook" active={showNotebook} size={22} />
                      </span>
                      {railExpanded ? (
                        <>
                          <span className={`text-xs font-bold truncate ${showNotebook ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>Study Notebook</span>
                          <span className="ml-auto bg-[#F97316] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black shadow-xs">
                            {totalNotesCount}
                          </span>
                        </>
                      ) : (
                        <>
                          {totalNotesCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                              {totalNotesCount}
                            </span>
                          )}
                          <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                            Study Notebook ({totalNotesCount})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 9. BOOKMARK */}
                {isStudentProfile && (
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={toggleBookmark}
                      title={isBookmarked ? "Bookmarked (Click to remove)" : "Bookmark Page"}
                      className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                        railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                      } ${
                        isBookmarked
                          ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                          : isDarkDesk
                            ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                            : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                      }`}
                    >
                      {isBookmarked && (
                        <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                        <ReaderToolIcon3D id="bookmark" active={isBookmarked} size={22} />
                      </span>
                      {railExpanded ? (
                        <span className={`text-xs font-bold truncate ${isBookmarked ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>
                          {isBookmarked ? "Bookmarked" : "Bookmark"}
                        </span>
                      ) : (
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          {isBookmarked ? "Bookmarked" : "Bookmark Page"}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 10. ZOOM SECTION (PDF) */}
                {book.pdfUrl && (
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={toggleSectionZoom}
                      title="Zoom Section (Select and magnify diagram or area)"
                      className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none ${
                        railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                      } ${
                        sectionSelectActive
                          ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                          : isDarkDesk
                            ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                            : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                      }`}
                    >
                      {sectionSelectActive && (
                        <span aria-hidden="true" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]" />
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                        <ReaderToolIcon3D id="zoomSection" active={sectionSelectActive} size={22} />
                      </span>
                      {railExpanded ? (
                        <span className={`text-xs font-bold truncate ${sectionSelectActive ? "text-[#111214]" : isDarkDesk ? "text-white/90" : "text-[#111214]"}`}>
                          {sectionSelectActive ? "Selecting..." : "Zoom Section"}
                        </span>
                      ) : (
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl border border-white/15">
                          Zoom Section
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 11. UNDO / REDO */}
                <div className={`w-full flex items-center ${railExpanded ? "justify-between px-1 gap-2" : "justify-center gap-1"} py-1`}>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Undo annotation (Ctrl+Z)"
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      historyIndex > 0
                        ? isDarkDesk
                          ? "text-zinc-200 hover:bg-white/15 hover:text-white cursor-pointer active:scale-95"
                          : "text-zinc-700 hover:bg-white/80 hover:text-[#111214] cursor-pointer active:scale-95"
                        : isDarkDesk ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    <Undo2 size={16} />
                    {railExpanded && (
                      <span className={`ml-1.5 text-xs font-bold ${
                        historyIndex > 0
                          ? isDarkDesk ? "text-zinc-200" : "text-[#111214]"
                          : isDarkDesk ? "text-zinc-600" : "text-zinc-400"
                      }`}>
                        Undo
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex < 0 || historyIndex >= history.length - 1}
                    title="Redo annotation (Ctrl+Y)"
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      historyIndex >= 0 && historyIndex < history.length - 1
                        ? isDarkDesk
                          ? "text-zinc-200 hover:bg-white/15 hover:text-white cursor-pointer active:scale-95"
                          : "text-zinc-700 hover:bg-white/80 hover:text-[#111214] cursor-pointer active:scale-95"
                        : isDarkDesk ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    <Redo2 size={16} />
                    {railExpanded && (
                      <span className={`ml-1.5 text-xs font-bold ${
                        historyIndex >= 0 && historyIndex < history.length - 1
                          ? isDarkDesk ? "text-zinc-200" : "text-[#111214]"
                          : isDarkDesk ? "text-zinc-600" : "text-zinc-400"
                      }`}>
                        Redo
                      </span>
                    )}
                  </button>
                </div>
              </nav>
            </div>

            {/* Bottom Rail Controls: Compact/Expand + Minimize */}
            <div className={`flex flex-col items-center gap-1.5 pt-3 border-t ${isDarkDesk ? "border-white/10" : "border-black/5"}`}>
              <button
                type="button"
                onClick={toggleRailExpanded}
                aria-label={railExpanded ? "Compact sidebar rail" : "Expand sidebar labels"}
                className={`w-full flex items-center ${
                  railExpanded ? "justify-between px-3" : "justify-center"
                } py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDarkDesk
                    ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                    : "text-zinc-700 hover:bg-white/70 hover:text-[#111214]"
                }`}
              >
                <PanelLeft size={16} />
                {railExpanded && <span>Compact Rail</span>}
              </button>

              <button
                type="button"
                onClick={toggleRailMinimized}
                aria-label="Hide sidebar for full-screen reading"
                className={`w-full flex items-center ${
                  railExpanded ? "justify-between px-3" : "justify-center"
                } py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDarkDesk
                    ? "text-zinc-400 hover:bg-white/10 hover:text-white"
                    : "text-zinc-600 hover:bg-white/70 hover:text-[#111214]"
                }`}
              >
                <PanelLeftClose size={16} />
                {railExpanded && <span>Hide Rail</span>}
              </button>
            </div>
          </aside>
        )}

        {/* ACTIVE RAIL FLYOUT POPOVER (Positioned at fixed z-[250] - Guaranteed above menu bar & never clipped) */}
        {activeRailPopover && (
          <>
            {/* Fullscreen Dismiss Backdrop */}
            <div
              className="fixed inset-0 z-[240] bg-black/10 backdrop-blur-[1px]"
              onClick={() => setActiveRailPopover(null)}
              aria-hidden="true"
            />
            <div
              className="fixed z-[250] select-none animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: railMinimized ? "68px" : railExpanded ? "244px" : "88px",
                top: `${popoverAnchorY}px`,
              }}
            >
              {/* 1. Theme Flyout */}
              {activeRailPopover === "theme" && (
                <div
                  className={`w-64 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl text-xs space-y-1 ${
                    isDarkDesk ? "bg-slate-900 border border-white/20 text-white" : "bg-white border border-slate-200 text-zinc-900"
                  }`}
                  style={{ backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)" }}
                >
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 tracking-wider border-b mb-1 flex items-center justify-between ${
                    isDarkDesk ? "text-amber-300 border-white/10" : "text-zinc-500 border-slate-100"
                  }`}>
                    <span>Reading Themes</span>
                    <span className="opacity-60 text-[9px]">5 Styles</span>
                  </div>
                  {Object.values(READING_THEMES).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setThemeKey(t.id);
                        setActiveRailPopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left font-semibold transition-all cursor-pointer ${
                        themeKey === t.id
                          ? "bg-amber-400 text-black font-bold shadow-md"
                          : isDarkDesk
                            ? "hover:bg-white/15 text-white"
                            : "hover:bg-slate-100 text-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs shrink-0" style={{ backgroundColor: t.pageBg }} />
                        <span>{t.name}</span>
                      </div>
                      {themeKey === t.id && <Check size={13} className="text-black stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Page Lights Flyout */}
              {activeRailPopover === "lights" && (
                <div
                  className={`w-64 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-xs space-y-3.5 ${
                    isDarkDesk ? "bg-slate-900 border border-white/20 text-white" : "bg-white border border-slate-200 text-zinc-900"
                  }`}
                  style={{ backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)" }}
                >
                  <div className={`flex items-center justify-between pb-1 border-b font-bold ${
                    isDarkDesk ? "border-white/10 text-amber-300" : "border-slate-100 text-zinc-900"
                  }`}>
                    <span>Page Light Controls</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBrightness(100);
                        setWarmLight(0);
                      }}
                      className="text-[10px] text-amber-600 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1 font-semibold"><Sun size={12} /> Brightness</span>
                      <span className="font-bold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="140"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`flex items-center gap-1 font-semibold ${isDarkDesk ? "text-amber-300" : "text-amber-600"}`}><Moon size={12} /> Warm Night Light</span>
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
                    <div className="text-[10px] opacity-60 mt-1 leading-tight">
                      Soft amber eye-protection filter for fatigue-free night study.
                    </div>
                  </div>
                </div>
              )}

              {/* 3. e-Book Style Flyout */}
              {activeRailPopover === "epubStyle" && (
                <div
                  className={`w-64 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl text-xs space-y-1 ${
                    isDarkDesk ? "bg-slate-900 border border-white/20 text-white" : "bg-white border border-slate-200 text-zinc-900"
                  }`}
                  style={{ backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)" }}
                >
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 tracking-wider border-b flex items-center justify-between mb-1 ${
                    isDarkDesk ? "text-amber-300 border-white/10" : "text-zinc-500 border-slate-100"
                  }`}>
                    <span>e-Book Style</span>
                    <span className="text-[9px] opacity-60 font-normal">Auto / Custom</span>
                  </div>
                  {EPUB_COLOR_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setThemeKey(mode.id);
                        setEpubColorMode(mode.id);
                        setActiveRailPopover(null);
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        epubColorMode === mode.id
                          ? "bg-amber-400 text-black font-bold shadow-md"
                          : isDarkDesk
                            ? "hover:bg-white/15 text-white"
                            : "hover:bg-slate-100 text-zinc-800"
                      }`}
                    >
                      <div className="mt-0.5">
                        <Check size={13} className={epubColorMode === mode.id ? "opacity-100 text-black stroke-[2.5]" : "opacity-0"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs">{mode.name}</div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${epubColorMode === mode.id ? "text-black/80 font-medium" : "opacity-70"}`}>
                          {mode.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 4. Highlighter Color Palette Flyout */}
              {activeRailPopover === "highlighter" && (
                <div
                  className={`w-56 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl text-xs space-y-2 ${
                    isDarkDesk ? "bg-slate-900 border border-white/20 text-white" : "bg-white border border-slate-200 text-zinc-900"
                  }`}
                  style={{ backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)" }}
                >
                  <div className={`text-[10px] uppercase font-bold tracking-wider border-b pb-1 flex items-center justify-between ${
                    isDarkDesk ? "text-amber-300 border-white/10" : "text-zinc-600 border-slate-100"
                  }`}>
                    <span>Highlight Color</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleHighlighter();
                        setActiveRailPopover(null);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeTool === "highlight"
                          ? "bg-amber-400 text-black"
                          : isDarkDesk
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-zinc-700"
                      }`}
                    >
                      {activeTool === "highlight" ? "TURN OFF" : "ACTIVATE"}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {Object.values(HIGHLIGHT_COLORS).map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          selectHighlightColor(col.id);
                          setActiveTool("highlight");
                          setActiveRailPopover(null);
                        }}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          highlightColor === col.id
                            ? "ring-2 ring-black scale-110 shadow-md"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: col.border }}
                        title={`Highlight with ${col.name}`}
                      >
                        {highlightColor === col.id && <Check size={12} className="text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] opacity-60 leading-tight pt-1">
                    Select color and drag across text to highlight.
                  </p>
                </div>
              )}

              {/* 5. Sticky Note Config Flyout */}
              {activeRailPopover === "sticky" && (
                <div
                  className={`w-60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl text-xs space-y-3 ${
                    isDarkDesk ? "bg-slate-900 border border-white/20 text-white" : "bg-white border border-slate-200 text-zinc-900"
                  }`}
                  style={{ backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)" }}
                >
                  <div className={`text-[10px] uppercase font-bold tracking-wider border-b pb-1 flex items-center justify-between ${
                    isDarkDesk ? "text-amber-300 border-white/10" : "text-zinc-600 border-slate-100"
                  }`}>
                    <span>New Sticky Note</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleStickyTool();
                        setActiveRailPopover(null);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeTool === "sticky"
                          ? "bg-amber-400 text-black"
                          : isDarkDesk
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-zinc-700"
                      }`}
                    >
                      {activeTool === "sticky" ? "TURN OFF" : "DROP NOTE"}
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] opacity-60 block mb-1">Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(STICKY_COLORS).map(([cKey, cVal]) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => {
                            setStickyColor(cKey);
                            setActiveTool("sticky");
                            setActiveRailPopover(null);
                          }}
                          className={`w-7 h-7 rounded-full border transition-transform cursor-pointer flex items-center justify-center ${
                            stickyColor === cKey
                              ? "ring-2 ring-black scale-110 shadow-md border-black"
                              : "border-black/20 hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: cVal.border }}
                          title={cVal.label}
                        >
                          {stickyColor === cKey && <Check size={12} className="text-black stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] opacity-60 block mb-1">Category Tag</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Note", "Code", "Formula", "Exam"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setStickyTag(tag);
                            setActiveTool("sticky");
                            setActiveRailPopover(null);
                          }}
                          className={`px-2 py-1 rounded-lg text-left font-semibold text-xs transition-all cursor-pointer ${
                            stickyTag === tag
                              ? "bg-amber-400 text-black font-bold"
                              : isDarkDesk
                                ? "bg-white/10 hover:bg-white/15 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-zinc-800"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] opacity-60 leading-tight">
                    Click anywhere on the book page or in margins to place note.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* MINIMIZED FLOATING RESTORE PILL (Shown when rail is minimized) */}
        {railMinimized && (
          <button
            type="button"
            onClick={toggleRailMinimized}
            className={`fixed left-3 top-20 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer group hover:scale-105 shadow-xl backdrop-blur-xl ${
              isDarkDesk
                ? "bg-slate-900/95 hover:bg-slate-900 text-white border border-white/20"
                : "bg-white/95 hover:bg-white text-[#111214] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.15)]"
            }`}
            style={{
              backgroundColor: isDarkDesk ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
            }}
            title="Open Reader Tools Rail"
          >
            <PanelLeftOpen size={16} className="text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold">Reader Tools</span>
          </button>
        )}

        {/* MAIN READING CANVAS VIEWPORT */}
        <div
          ref={readingDeskRef}
          onPointerDown={handleDeskPointerDown}
          className="flex-1 flex items-center justify-center p-4 sm:p-8 md:px-16 lg:px-20 overflow-x-auto overflow-y-auto relative z-0 min-h-[600px]"
          style={{ backgroundColor: currentTheme.outerBg }}
        >
          {/* Floating Left Page Turn Button (Image 2 style) */}
          {!sectionCrop && (
            <button
              type="button"
              onClick={prev}
              disabled={isPrevDisabled}
              aria-label="Previous Page"
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none cursor-pointer group hover:border-amber-400/60"
            >
              <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Floating Right Page Turn Button (Image 2 style) */}
          {!sectionCrop && (
            <button
              type="button"
              onClick={next}
              disabled={isNextDisabled}
              aria-label="Next Page"
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none cursor-pointer group hover:border-amber-400/60"
            >
              <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

        <div
          ref={pageBoxRef}
          onPointerDown={handlePagePointerDown}
          onPointerMove={handlePagePointerMove}
          onPointerUp={handlePagePointerUp}
          onPointerCancel={handlePagePointerUp}
          onDragStart={(e) => e.preventDefault()}
          className={`no-select select-none relative rounded-2xl flex flex-col items-center transition-all ${
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
            boxShadow: currentTheme.id === "cleanLight"
              ? "0 20px 45px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)"
              : "0 25px 65px -12px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.08)",
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
          ) : isEpub && currentEpubSection?.type === "epub" ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative z-0 py-4"
              style={{ filter: "none" }}
            >
              {isEpubLoading || !activeEpubPageHtml ? (
                <div className="py-20 px-8 flex items-center justify-center">
                  <BookLoader
                    book={book}
                    message={`Loading ${currentEpubSection?.title || "e-Book section"}...`}
                    size="md"
                  />
                </div>
              ) : epubError ? (
                <div className="p-16 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 font-bold text-lg">!</div>
                  <p className="text-red-600 font-semibold mb-1">Unable to load e-Book section</p>
                  <p className="text-xs text-gray-500 max-w-sm">{epubError}</p>
                </div>
              ) : (
                <div className="relative w-full flex justify-center items-center">
                  <iframe
                    title={currentEpubSection?.title || "e-Book page"}
                    srcDoc={activeEpubPageHtml}
                    className={`border-0 shadow-lg rounded-md overflow-hidden ${activeTool || lineFocus || draggingStickyId ? "pointer-events-none" : "pointer-events-auto"}`}
                    style={{
                      width: "100%",
                      maxWidth: `${Math.min(BASE_PDF_WIDTH, epubPageDimensions.width || 640)}px`,
                      height: epubPageDimensions.height
                        ? `${Math.round(epubPageDimensions.height * (Math.min(BASE_PDF_WIDTH, epubPageDimensions.width || 640) / (epubPageDimensions.width || 510)))}px`
                        : "800px",
                      backgroundColor: currentTheme.pageBg || "#ffffff"
                    }}
                  />
                  {(activeTool || lineFocus || draggingStickyId) && (
                    <div className="absolute inset-0 z-10" />
                  )}
                </div>
              )}
            </div>
          ) : activeDocumentUrl ? (
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none relative z-0"
              style={{ filter: currentTheme.canvasFilter }}
            >
              <Document
                file={activeDocumentUrl}
                onLoadSuccess={(pdf) => {
                  setNumPdfPages(pdf.numPages);
                  pdfDocRef.current = pdf;
                }}
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

          {/* LINE FOCUS / READING RULER (RENDERED ON TOP OF PDF & EPUB CANVAS) */}
          {lineFocus && (
            <div
              className="absolute inset-0 z-40 overflow-hidden rounded-xl cursor-ns-resize"
              onPointerMove={(e) => {
                if (!pageBoxRef.current) return;
                const rect = pageBoxRef.current.getBoundingClientRect();
                const relY = e.clientY - rect.top;
                setLineFocusY(Math.max(20, Math.min(rect.height - 20, relY)));
              }}
            >
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
              const isMarginRight = n.placement === "margin-right" || n.x >= 92;
              const isMarginLeft = n.placement === "margin-left" || n.x < 0;
              const isOutsideMargin = isMarginRight || isMarginLeft;
              const isBeingDragged = draggingStickyId === n.id && dragPosition?.id === n.id;

              let styleLeft;
              let styleRight;
              let styleTop;

              if (isBeingDragged) {
                // Free floating while dragging using exact grab offset
                styleLeft = `${dragPosition.x}px`;
                styleRight = undefined;
                styleTop = `${dragPosition.y}px`;
              } else if (isMarginRight) {
                styleLeft = "calc(100% + 14px)";
                styleRight = undefined;
                styleTop = `${Math.max(1, Math.min(88, n.y))}%`;
              } else if (isMarginLeft) {
                styleLeft = undefined;
                styleRight = "calc(100% + 14px)";
                styleTop = `${Math.max(1, Math.min(88, n.y))}%`;
              } else {
                styleLeft = `clamp(2%, ${n.x}%, calc(100% - ${n.isCollapsed ? 150 : 256}px))`;
                styleRight = undefined;
                styleTop = `${Math.max(1, Math.min(88, n.y))}%`;
              }

              return (
                <div
                  key={n.id}
                  className={`sticky-note-wrapper absolute z-50 pointer-events-auto rounded-xl select-none ${
                    isBeingDragged
                      ? "cursor-grabbing shadow-2xl scale-102 rotate-1 opacity-95 transition-none ring-2 ring-amber-400"
                      : "shadow-xl transition-[border-color,box-shadow]"
                  } ${isOutsideMargin && !isBeingDragged ? "ring-2 ring-amber-400/80" : ""}`}
                  style={{
                    left: styleLeft,
                    right: styleRight,
                    top: styleTop,
                    width: n.isCollapsed ? "auto" : "240px",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {n.isCollapsed ? (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:brightness-95 active:scale-98 transition-transform select-none"
                      style={{
                        backgroundColor: col.bg,
                        border: `1.5px solid ${col.border}`,
                        color: col.text,
                        minWidth: "130px",
                        maxWidth: "240px",
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapseSticky(n.id);
                      }}
                      title="Click anywhere to expand note"
                    >
                      {/* Drag Grip on Minimized Note */}
                      <span
                        onPointerDown={(e) => startDragSticky(e, n.id)}
                        className="cursor-grab active:cursor-grabbing p-0.5 text-black/40 hover:text-black shrink-0"
                        title="Drag note"
                      >
                        <GripVertical size={13} />
                      </span>

                      <span className="text-sm shrink-0">📌</span>

                      {/* Note Tag Badge */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 shrink-0">
                        {n.tag || "Note"}
                      </span>

                      {/* Note Text preview */}
                      <span className="truncate flex-1 text-[11px] font-medium text-black/85">
                        {n.text ? n.text : "Empty note"}
                      </span>

                      {/* Margin tag if outside */}
                      {isOutsideMargin && (
                        <span className="text-[9px] bg-black/15 font-semibold px-1 py-0.5 rounded shrink-0">
                          Margin
                        </span>
                      )}

                      {/* Single-Click Expand Button */}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapseSticky(n.id);
                        }}
                        className="p-1 rounded-md hover:bg-black/15 cursor-pointer shrink-0 text-black/70 hover:text-black"
                        title="Expand note"
                      >
                        <Maximize2 size={12} />
                      </button>

                      {/* Quick Delete directly on Minimized Note */}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSticky(n.id);
                        }}
                        className="p-1 rounded-md hover:bg-black/15 text-rose-700 hover:text-rose-900 cursor-pointer shrink-0"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="p-3 space-y-2.5 rounded-xl select-none"
                      style={{
                        backgroundColor: col.bg,
                        border: `2px solid ${col.border}`,
                        color: col.text,
                        width: "240px",
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center justify-between gap-1 pb-1.5 border-b border-black/15 cursor-grab active:cursor-grabbing"
                        onPointerDown={(e) => {
                          if (e.target.closest("button") || e.target.closest("select")) return;
                          startDragSticky(e, n.id);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            onPointerDown={(e) => startDragSticky(e, n.id)}
                            className="cursor-grab active:cursor-grabbing text-black/40 hover:text-black p-0.5"
                            title="Drag to reposition note (inside book or out to margins)"
                          >
                            <GripVertical size={13} />
                          </span>
                          <select
                            value={n.tag}
                            onPointerDown={(e) => e.stopPropagation()}
                            onChange={(e) => updateStickyTag(n.id, e.target.value)}
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 outline-none cursor-pointer border-0"
                          >
                            <option value="Note">Note</option>
                            <option value="Code">Code</option>
                            <option value="Formula">Formula</option>
                            <option value="Exam">Exam Note</option>
                          </select>
                        </div>

                        {/* Header action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStickyPlacement(n.id);
                            }}
                            className="px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 text-[10px] font-bold transition-colors cursor-pointer"
                            title={isOutsideMargin ? "Move onto book page" : "Move outside book to margin"}
                          >
                            {isOutsideMargin ? "📖 Page" : "📋 Margin"}
                          </button>

                          {/* 1-Click Minimize Button */}
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollapseSticky(n.id);
                            }}
                            className="p-1 rounded-md hover:bg-black/15 text-black/70 hover:text-black cursor-pointer"
                            title="Minimize note"
                          >
                            <Minus size={13} />
                          </button>

                          {/* 1-Click Delete Button */}
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSticky(n.id);
                            }}
                            className="p-1 rounded-md hover:bg-black/15 text-rose-700 hover:text-rose-900 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Color Picker Swatches directly on the note */}
                      <div className="flex items-center gap-1.5 px-0.5">
                        {Object.entries(STICKY_COLORS).map(([cKey, cVal]) => (
                          <button
                            key={cKey}
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStickyColor(n.id, cKey);
                            }}
                            className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer border ${
                              n.color === cKey ? "scale-125 ring-2 ring-black/40 border-black/60" : "border-black/20 hover:scale-110"
                            }`}
                            style={{ backgroundColor: cVal.border }}
                            title={`Color: ${cVal.label}`}
                          />
                        ))}
                      </div>

                      {/* Textarea */}
                      <textarea
                        rows={3}
                        value={n.text}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateStickyText(n.id, e.target.value)}
                        placeholder={n.tag === "Code" ? "Paste code snippet here..." : "Type study notes..."}
                        className={`w-full bg-white/90 p-2 rounded-lg text-xs outline-none border border-black/15 resize-none select-text focus:ring-2 focus:ring-amber-400/80 ${
                          n.tag === "Code" ? "font-mono text-[11px]" : ""
                        }`}
                      />

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-black/60 pt-0.5">
                        <span className="truncate max-w-[110px] font-medium">{n.author}</span>
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
      </div>
      {/* End of READER BODY */}

      {/* PERSONAL STUDY NOTEBOOK SLIDE-OUT DRAWER */}
      {showNotebook && (
        <>
          <div
            className="fixed inset-0 z-[125] bg-black/60 backdrop-blur-xs"
            onClick={() => setShowNotebook(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[130] w-full max-w-md reader-dropdown-noisy border-l border-white/20 shadow-2xl flex flex-col text-white">
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
                                goToGlobalPage(n.pageNumber);
                              }}
                              className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                            >
                              Jump to page
                            </button>
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSticky(n.id);
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-white/10 cursor-pointer"
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
                              goToGlobalPage(h.pageNumber);
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
                            goToGlobalPage(bm);
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

      {/* FOOTER CONTROLS: PREVIOUS / NEXT / SLIDER SCRUBBER (Image 2 style) */}
      <div
        className="flex items-center justify-between gap-3 sm:gap-6 py-3 px-4 sm:px-8 border-t border-white/10 z-20 backdrop-blur-xl shadow-lg shrink-0"
        style={{ backgroundColor: currentTheme.headerBg }}
      >
        {/* Left: Previous Button & Section Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={prev}
            disabled={isPrevDisabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ChevronLeft size={15} strokeWidth={2.2} /> <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="text-xs font-bold text-white/70 hidden md:inline-flex items-center gap-1.5">
            <span className="text-white/40">Section:</span>
            <span className="text-amber-300 font-extrabold max-w-[150px] truncate">
              {currentEpubSection ? currentEpubSection.title : "Document"}
            </span>
            {isEpub && epubSections.length > 0 && (
              <span className="text-white/40 text-[10px] font-normal">
                ({currentSectionIdx + 1}/{epubSections.length})
              </span>
            )}
          </span>
        </div>

        {/* Center: Continuous Progress Scrubber / Slider (Image 2 style) */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-6 flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider hidden lg:inline whitespace-nowrap">
            Page:
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="1"
              max={totalPages || 1}
              value={currentPageDisplay}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= (totalPages || 1)) {
                  goToGlobalPage(val);
                }
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-yellow-300 transition-all focus:outline-none"
              title={`Drag to scrub page (1 to ${totalPages || 1})`}
            />
          </div>
          <span className="text-xs font-bold text-amber-300 whitespace-nowrap shrink-0">
            {currentPageDisplay} <span className="text-white/50 font-normal">of</span> {totalPages || 1}
          </span>
        </div>

        {/* Right: Direct Page Input Jump & Next Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-black/40 border border-white/15 px-2.5 py-1 rounded-xl shadow-inner">
            <span className="text-[11px] text-white/60 font-semibold">Page</span>
            <input
              type="number"
              className="w-11 px-1 py-0.5 text-center text-xs font-bold rounded-lg bg-white/15 text-white outline-none border border-white/20 focus:border-amber-400 focus:bg-white focus:text-black transition-all"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onBlur={handleJump}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJump();
              }}
            />
          </div>

          <button
            type="button"
            onClick={next}
            disabled={isNextDisabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold text-black transition-all cursor-pointer shadow-md active:scale-95"
          >
            <span className="hidden sm:inline">Next</span> <ChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* FLOATING VOICE / AUDIO READER WIDGET (Compact Left-Side Window) */}
      {isVoiceActive && (
        <div
          ref={voiceWidgetRef}
          className={`fixed z-[300] select-none pointer-events-auto transition-shadow ${
            voicePosition
              ? ""
              : isVoiceExpanded
                ? "bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xl px-3 sm:px-4"
                : isVoiceMinimized
                  ? `${!railMinimized ? (railExpanded ? "sm:left-[248px]" : "sm:left-[88px]") : "sm:left-4"} left-3 bottom-20`
                  : `${!railMinimized ? (railExpanded ? "sm:left-[248px]" : "sm:left-[88px]") : "sm:left-4"} left-3 bottom-20 w-[310px] sm:w-[350px]`
          }`}
          style={
            voicePosition
              ? {
                  left: `${voicePosition.x}px`,
                  top: `${voicePosition.y}px`,
                  right: "auto",
                  bottom: "auto",
                  transform: "none",
                  width: isVoiceMinimized ? "auto" : isVoiceExpanded ? "min(580px, 92vw)" : "min(350px, 90vw)",
                }
              : undefined
          }
        >
          {isVoiceMinimized ? (
            /* MINIMIZED FLOATING PILL */
            <div
              onPointerDown={handleVoiceDragStart}
              onPointerMove={handleVoiceDragMove}
              onPointerUp={handleVoiceDragEnd}
              onPointerCancel={handleVoiceDragEnd}
              className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-full bg-black/95 backdrop-blur-2xl border border-amber-400/50 shadow-2xl text-xs text-white cursor-grab active:cursor-grabbing select-none hover:border-amber-400 transition-colors"
              title="Drag to reposition window • Click expand to restore"
            >
              <div className="flex items-center gap-1.5">
                <GripVertical size={13} className="text-white/40 hover:text-white transition-colors shrink-0" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <Headphones size={13} className="text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 text-[11px]">
                  {pageSpeechUnits.length > 0
                    ? `L${currentSpeechIndex + 1}/${pageSpeechUnits.length}`
                    : "Ready"}
                </span>
                <span className="text-white/40 text-[10px]">• P{currentPageDisplay}</span>
              </div>

              <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={toggleVoicePlayPause}
                  className="p-1 rounded-full bg-amber-400 text-black hover:bg-yellow-300 font-bold cursor-pointer"
                  title={isVoicePlaying ? "Pause" : "Play"}
                >
                  {isVoicePlaying ? <Pause size={11} className="fill-black" /> : <Play size={11} className="fill-black ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoiceMinimized(false)}
                  className="p-1 rounded-md hover:bg-white/15 text-white/70 hover:text-white cursor-pointer"
                  title="Restore full controls"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={closeVoiceReader}
                  className="p-1 rounded-md hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer"
                  title="Close voice reader"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : isVoiceExpanded ? (
            /* FULL EXPANDED STUDIO VIEW */
            <div className="rounded-2xl bg-black/95 backdrop-blur-2xl border border-amber-400/50 shadow-2xl p-4 text-white space-y-3">
              {/* Header with Drag Handle */}
              <div
                onPointerDown={handleVoiceDragStart}
                onPointerMove={handleVoiceDragMove}
                onPointerUp={handleVoiceDragEnd}
                onPointerCancel={handleVoiceDragEnd}
                className="flex items-center justify-between border-b border-white/10 pb-2 cursor-grab active:cursor-grabbing select-none"
                title="Drag to reposition window"
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0" />
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                    <Headphones size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      AI Voice Reader (Full View)
                    </span>
                    <div className="text-[11px] text-white/60">
                      Line <strong className="text-white">{currentSpeechIndex + 1}</strong> of <strong className="text-white">{pageSpeechUnits.length}</strong> • Page {currentPageDisplay} of {totalPages || 1}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSpeechUnitMode((m) => (m === "line" ? "sentence" : "line"))}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-semibold text-white/80 cursor-pointer"
                  >
                    {speechUnitMode === "line" ? "📄 Line Mode" : "💬 Sentences"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoAdvancePage((a) => !a)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      autoAdvancePage ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "bg-white/10 text-white/40"
                    }`}
                  >
                    Auto-Flip: {autoAdvancePage ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVoiceMinimized(true)}
                    className="p-1 rounded-md hover:bg-white/15 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                    title="Minimize to floating pill"
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVoiceExpanded(false)}
                    className="p-1 rounded-md hover:bg-white/15 text-amber-300 hover:text-white transition-colors cursor-pointer"
                    title="Compact view"
                  >
                    <Minimize2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={closeVoiceReader}
                    className="p-1 rounded-md hover:bg-rose-500/20 text-white/70 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Close voice reader"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Full Teleprompter Box */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 min-h-[70px] flex items-center">
                {pageSpeechUnits.length > 0 ? (
                  <p className="text-sm font-medium leading-relaxed text-amber-100 font-serif line-clamp-4 select-text">
                    <span className="text-amber-400 font-bold mr-1.5 text-base">“</span>
                    {pageSpeechUnits[currentSpeechIndex]}
                    <span className="text-amber-400 font-bold ml-1 text-base">”</span>
                  </p>
                ) : (
                  <div className="text-xs text-white/50 text-center w-full">
                    {isExtractingText ? "Extracting page lines..." : "No text on this page."}
                  </div>
                )}
              </div>

              {/* Expanded Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="text-xs font-medium bg-white/10 border border-white/15 rounded-xl px-2 py-1 text-amber-300 outline-none cursor-pointer max-w-[220px]"
                >
                  {curatedVoices.map((c) => (
                    <option key={c.voiceURI} value={c.voiceURI} className="bg-neutral-900 text-white">
                      {c.label}
                    </option>
                  ))}
                  {curatedVoices.length === 0 && <option value="">Default Clear Voice</option>}
                </select>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={stepPrevLine} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                    <SkipBack size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleVoicePlayPause}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isVoicePlaying ? <Pause size={13} className="fill-black" /> : <Play size={13} className="fill-black ml-0.5" />}
                    <span>{isVoicePlaying ? "Pause" : isVoicePaused ? "Resume" : "Play"}</span>
                  </button>
                  <button type="button" onClick={stepNextLine} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                    <SkipForward size={14} />
                  </button>
                  <button type="button" onClick={stopVoice} className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 cursor-pointer" title="Stop">
                    <Square size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRateChange(rate)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${voiceRate === rate ? "bg-amber-400 text-black" : "bg-white/10 text-white/70"}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* COMPACT LEFT-SIDE WINDOW (Admin-dashboard style) */
            <div className="rounded-2xl bg-black/95 backdrop-blur-2xl border border-amber-400/40 shadow-2xl p-3 text-white space-y-2.5">
              {/* Window Header with Drag Handle */}
              <div
                onPointerDown={handleVoiceDragStart}
                onPointerMove={handleVoiceDragMove}
                onPointerUp={handleVoiceDragEnd}
                onPointerCancel={handleVoiceDragEnd}
                className="flex items-center justify-between border-b border-white/10 pb-1.5 cursor-grab active:cursor-grabbing select-none"
                title="Drag to reposition window"
              >
                <div className="flex items-center gap-1.5">
                  <GripVertical size={14} className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0" />
                  <div className="w-5 h-5 rounded-md bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                    <Headphones size={11} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block leading-tight">
                      Voice Reader
                    </span>
                    <span className="text-[10px] text-white/50 block leading-tight">
                      Line {currentSpeechIndex + 1}/{pageSpeechUnits.length || 1} • P{currentPageDisplay}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setAutoAdvancePage((a) => !a)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      autoAdvancePage ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "bg-white/10 text-white/40"
                    }`}
                    title="Auto-flip to next page"
                  >
                    Auto-Flip: {autoAdvancePage ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVoiceMinimized(true)}
                    className="p-1 rounded-md hover:bg-white/15 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                    title="Minimize to floating pill"
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVoiceExpanded(true)}
                    className="p-1 rounded-md hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Expand full view"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={closeVoiceReader}
                    className="p-1 rounded-md hover:bg-rose-500/20 text-white/70 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Close voice reader"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Compact Line Preview */}
              <div
                onClick={() => setIsVoiceExpanded(true)}
                className="rounded-xl bg-white/5 border border-white/10 p-2 min-h-[44px] flex items-center cursor-pointer hover:bg-white/8 transition-colors group"
                title="Click to view full teleprompter"
              >
                {pageSpeechUnits.length > 0 ? (
                  <p className="text-[11px] font-medium leading-relaxed text-amber-100 font-serif line-clamp-2 select-text">
                    <span className="text-amber-400 font-bold mr-1">“</span>
                    {pageSpeechUnits[currentSpeechIndex]}
                    <span className="text-amber-400 font-bold ml-0.5">”</span>
                  </p>
                ) : (
                  <div className="text-[10px] text-white/40 text-center w-full">
                    {isExtractingText ? "Extracting..." : "No text on page."}
                  </div>
                )}
              </div>

              {/* Curated Voice Selector (Clean & Clear) */}
              <div className="w-full">
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full text-[11px] font-semibold bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-2 py-1 text-amber-300 outline-none cursor-pointer truncate"
                  title="Select Voice"
                >
                  {curatedVoices.map((c) => (
                    <option key={c.voiceURI} value={c.voiceURI} className="bg-neutral-900 text-white">
                      {c.label}
                    </option>
                  ))}
                  {curatedVoices.length === 0 && <option value="">Default Clear Voice</option>}
                </select>
              </div>

              {/* Bottom Transport Controls */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={stepPrevLine}
                    disabled={currentSpeechIndex === 0 && currentPageDisplay <= 1}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white disabled:opacity-30 cursor-pointer"
                    title="Previous line"
                  >
                    <SkipBack size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoicePlayPause}
                    disabled={pageSpeechUnits.length === 0}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 text-black font-bold text-[11px] flex items-center gap-1 shadow-md cursor-pointer active:scale-95 disabled:opacity-40"
                    title={isVoicePlaying ? "Pause" : "Play"}
                  >
                    {isVoicePlaying ? <Pause size={11} className="fill-black" /> : <Play size={11} className="fill-black ml-0.5" />}
                    <span>{isVoicePlaying ? "Pause" : isVoicePaused ? "Resume" : "Play"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={stepNextLine}
                    disabled={currentSpeechIndex >= pageSpeechUnits.length - 1 && currentPageDisplay >= totalPages}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white disabled:opacity-30 cursor-pointer"
                    title="Next line"
                  >
                    <SkipForward size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={stopVoice}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 cursor-pointer"
                    title="Stop"
                  >
                    <Square size={12} />
                  </button>
                </div>

                {/* Speed buttons */}
                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRateChange(rate)}
                      className={`px-1 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                        voiceRate === rate
                          ? "bg-amber-400 text-black shadow-xs"
                          : "bg-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
