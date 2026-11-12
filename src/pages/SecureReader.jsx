import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw, ScanSearch, X } from "lucide-react";
import { palette, fontDisplay, fontBody } from "../theme";
import { supabase } from "../supabaseClient";
import Button from "../components/Button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import BookLoader from "../components/BookLoader";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BASE_PDF_WIDTH = 600;
const MIN_SECTION_ZOOM = 0.75;
const MAX_SECTION_ZOOM = 4.0;
const SECTION_ZOOM_STEP = 0.25;

export default function SecureReader({ book, session, onBack }) {
  const [page, setPage] = useState(0); // For text pages
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [warning, setWarning] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [jumpInput, setJumpInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  // Particular Section Zoom state (no mouse/touchpad zoom)
  const [sectionSelectActive, setSectionSelectActive] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [sectionCrop, setSectionCrop] = useState(null);
  const [sectionZoom, setSectionZoom] = useState(1.5);
  const readerRootRef = useRef(null);
  const pageBoxRef = useRef(null);
  const areaStartRef = useRef(null);

  // Per-session reading pace rate limit (prevents bot scraping)
  const [paceWarning, setPaceWarning] = useState(false);
  const pageTurnsRef = useRef([]);

  // CDN Signed URLs: Offload Postgres database and serve PDFs from Cloudflare Edge CDN
  const [cdnPdfUrl, setCdnPdfUrl] = useState(null);
  const [isLoadingPdfUrl, setIsLoadingPdfUrl] = useState(false);

  // Stop audio on unmount or page change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [page]);

  const toggleReadAloud = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (book.pdfUrl) return; // Cant read PDFs easily
      const utterance = new SpeechSynthesisUtterance(book.pages[page]);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const totalPages = book.pdfUrl ? (numPdfPages || book.totalPages || 0) : (book.totalPages || book.pages.length);
  const currentPageDisplay = book.pdfUrl ? pdfPageNumber : (page + 1);

  // Resume logic on mount
  useEffect(() => {
    const saved = localStorage.getItem(`resume_${book.id}`);
    if (saved) {
       const p = parseInt(saved, 10);
       if (book.pdfUrl) setPdfPageNumber(p);
       else setPage(p - 1);
    }
  }, [book.id, book.pdfUrl]);

  // Save on page turn
  useEffect(() => {
    localStorage.setItem(`resume_${book.id}`, currentPageDisplay.toString());
  }, [currentPageDisplay, book.id]);

  // Reset section zoom state when switching books or turning pages
  useEffect(() => {
    setSectionSelectActive(false);
    setSelectionRect(null);
    setSectionCrop(null);
    areaStartRef.current = null;
  }, [book.id, pdfPageNumber]);

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

  // Explicitly disable zooming via mouse wheel / trackpad pinch inside the reader
  useEffect(() => {
    const root = readerRootRef.current;
    if (!root || !book.pdfUrl) return;
    const blockWheelZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    root.addEventListener("wheel", blockWheelZoom, { passive: false });
    return () => root.removeEventListener("wheel", blockWheelZoom);
  }, [book.pdfUrl]);

  const getSelectionMetrics = (clientX, clientY) => {
    const outer = pageBoxRef.current;
    if (!outer) return null;
    const pageEl = outer.querySelector('.react-pdf__Page') || outer;
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

  const handlePagePointerDown = (e) => {
    if (!book.pdfUrl || !sectionSelectActive || e.button !== 0) return;
    const pt = getSelectionMetrics(e.clientX, e.clientY);
    if (!pt) return;
    areaStartRef.current = pt;
    setSelectionRect({ left: pt.offsetX + pt.x, top: pt.offsetY + pt.y, width: 0, height: 0 });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };

  const handlePagePointerMove = (e) => {
    if (!sectionSelectActive || !areaStartRef.current) return;
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

    if (!sectionSelectActive || !areaStartRef.current) return;
    const pt = getSelectionMetrics(e.clientX, e.clientY);
    const start = areaStartRef.current;
    areaStartRef.current = null;
    setSelectionRect(null);
    setSectionSelectActive(false);

    if (!pt) return;

    const rawLeft = Math.min(start.x, pt.x);
    const rawTop = Math.min(start.y, pt.y);
    const boxW = Math.abs(pt.x - start.x);
    const boxH = Math.abs(pt.y - start.y);

    let fx;
    let fy;
    let fw;
    let fh;

    if (boxW >= 18 && boxH >= 18) {
      fx = rawLeft / pt.pageWidth;
      fy = rawTop / pt.pageHeight;
      fw = boxW / pt.pageWidth;
      fh = boxH / pt.pageHeight;
    } else {
      // Single click selects a focused section around the clicked point
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
  };

  // CDN Signed URL resolution for PDFs (expires in 2 hours = 7200s)
  useEffect(() => {
    let isMounted = true;
    async function resolveSignedCdnUrl() {
      if (!book.pdfUrl) {
        setCdnPdfUrl(null);
        return;
      }
      try {
        let storagePath = null;
        if (book.pdfUrl.includes('/storage/v1/object/public/pdfs/')) {
          storagePath = book.pdfUrl.split('/storage/v1/object/public/pdfs/')[1]?.split('?')[0];
        } else if (book.pdfUrl.includes('/pdfs/')) {
          storagePath = book.pdfUrl.split('/pdfs/')[1]?.split('?')[0];
        }

        if (storagePath) {
          setIsLoadingPdfUrl(true);
          const decodedPath = decodeURIComponent(storagePath);
          const { data, error } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(decodedPath, 7200);

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

  // Telemetry session tracking with UNLIMITED simultaneous logins (no seat cap)
  useEffect(() => {
    if (session.type !== "license" && session.role !== "reader") return;

    let heartbeatInterval;
    async function initSession() {
      try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
        // Clean up dead sessions
        await supabase.from('reading_sessions').delete().lt('last_active', fiveMinsAgo);

        // Unlimited simultaneous logins per ID: each device/browser tab gets an independent session
        const mySessionId = localStorage.getItem('reader_session_id') || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('reader_session_id', mySessionId);

        // Record telemetry without blocking
        await supabase.from('reading_sessions').upsert({
          id: mySessionId,
          license_id: session.id,
          book_id: book.id,
          last_active: new Date().toISOString()
        });
        
        await supabase.from('book_views').insert([{
          id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          book_id: book.id,
          license_id: session.id,
          viewed_at: new Date().toISOString()
        }]);

        // Heartbeat keeps session alive
        heartbeatInterval = setInterval(() => {
          supabase.from('reading_sessions').update({ last_active: new Date().toISOString() }).eq('id', mySessionId);
        }, 45000);
      } catch (err) {
        console.warn("Session tracking non-blocking telemetry notice:", err);
      }
    }
    initSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [book.id, session]);

  // Per-session reading pace rate limiter (anti-scraping check)
  const checkPaceLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - 60000; // 60s sliding window
    const recent = pageTurnsRef.current.filter(t => t > windowStart);
    const burst = recent.filter(t => t > now - 4000); // 4s burst window

    // Limit: Max 40 pages per minute or 7 pages within 4 seconds
    if (recent.length >= 40 || burst.length >= 7) {
      setPaceWarning(true);
      setTimeout(() => setPaceWarning(false), 5000);
      return false;
    }

    recent.push(now);
    pageTurnsRef.current = recent;
    return true;
  }, []);

  // Sync jump input when page changes
  useEffect(() => {
    setJumpInput(currentPageDisplay.toString());
  }, [currentPageDisplay]);

  const handleJump = () => {
    let p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      if (!checkPaceLimit()) return;
      if (book.pdfUrl) setPdfPageNumber(p);
      else setPage(p - 1);
    } else {
      setJumpInput(currentPageDisplay.toString());
    }
  };

  const next = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (book.pdfUrl) setPdfPageNumber(p => Math.min(p + 1, totalPages));
    else setPage(p => Math.min(p + 1, totalPages - 1));
  }, [totalPages, book.pdfUrl, checkPaceLimit]);
  
  const prev = useCallback(() => {
    if (!checkPaceLimit()) return;
    if (book.pdfUrl) setPdfPageNumber(p => Math.max(p - 1, 1));
    else setPage(p => Math.max(p - 1, 0));
  }, [book.pdfUrl, checkPaceLimit]);

  // Deterrents & Strict Focus Lock
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
        setIsFocused(false); // Force black screen instantly
        setTimeout(() => setWarning(false), 2500);
        
        if (isPrintScreen || isMacScreenshot) {
          // Use the native Clipboard API for free to overwrite screenshots
          try {
            navigator.clipboard.writeText("Screenshots are disabled for copyrighted material. Content is securely protected.");
          } catch(err) {}
        }
      }
      const isTypingInInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if (e.type === "keydown" && !isTypingInInput) {
        if (e.key === "Escape") {
          if (sectionCrop) {
            handleCloseSectionZoom();
          } else {
            setSectionSelectActive(false);
            setSelectionRect(null);
            areaStartRef.current = null;
          }
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
    document.addEventListener("keyup", applyScreenshotRestrictionAPI); // Crucial for Windows PrintScreen
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("keydown", applyScreenshotRestrictionAPI);
      document.removeEventListener("keyup", applyScreenshotRestrictionAPI);

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [next, prev, sectionCrop, handleCloseSectionZoom]);

  // Watermark college name and date without exposing individual student PII
  const collegeName = session?.institution || session?.name || "Licensed Institution";
  const accessDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const watermarkText = `${collegeName.toUpperCase()} • LICENSED ACCESS • ${accessDate}`;

  const renderedSectionWidth = sectionCrop ? Math.round(BASE_PDF_WIDTH * sectionZoom) : BASE_PDF_WIDTH;
  const renderedSectionHeight = sectionCrop ? Math.round(renderedSectionWidth * (sectionCrop.pageHeight / sectionCrop.pageWidth)) : 0;
  const sectionCropLeft = sectionCrop ? Math.round(sectionCrop.fx * renderedSectionWidth) : 0;
  const sectionCropTop = sectionCrop ? Math.round(sectionCrop.fy * renderedSectionHeight) : 0;
  const sectionCropWidth = sectionCrop ? Math.max(48, Math.round(sectionCrop.fw * renderedSectionWidth)) : 0;
  const sectionCropHeight = sectionCrop ? Math.max(48, Math.round(sectionCrop.fh * renderedSectionHeight)) : 0;

  return (
    <div ref={readerRootRef} className="min-h-[calc(100vh-64px)] flex flex-col relative" style={{ backgroundColor: palette.forest2 }}>
      
      {!isFocused && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <ShieldAlert size={48} className="text-white mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Reading Paused</h2>
          <p className="text-gray-300">Click anywhere to resume secure reading.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3" style={{ backgroundColor: palette.forest }}>
        <button onClick={onBack} className="flex items-center gap-2 text-sm shrink-0" style={{ color: palette.cream }}>
          <ArrowLeft size={16} strokeWidth={1.8} /> Back to library
        </button>
        <div className="text-sm text-center truncate max-w-xs sm:max-w-md" style={{ ...fontDisplay, color: palette.brassLight }}>{book.title}</div>
        <div className="flex items-center justify-end gap-2">
          {book.pdfUrl ? (
            <button
              type="button"
              onClick={() => {
                setSectionSelectActive((a) => !a);
                setSelectionRect(null);
                areaStartRef.current = null;
              }}
              title="Select a particular section of the PDF to zoom in / out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
              style={{
                backgroundColor: sectionSelectActive ? palette.brassLight : "rgba(0,0,0,0.2)",
                borderColor: sectionSelectActive ? palette.brassLight : "rgba(255,255,255,0.2)",
                color: sectionSelectActive ? palette.forest : palette.cream,
              }}
            >
              <ScanSearch size={14} />
              <span>{sectionSelectActive ? "Selecting Section..." : "Zoom Section"}</span>
            </button>
          ) : (
            <button 
              onClick={toggleReadAloud} 
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded transition-colors"
              style={{ color: isPlaying ? palette.forest : palette.cream, backgroundColor: isPlaying ? palette.brassLight : 'transparent' }}
            >
              {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />} 
              {isPlaying ? "Stop" : "Read Aloud"}
            </button>
          )}
        </div>
      </div>

      {sectionSelectActive && book.pdfUrl && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold" style={{ backgroundColor: palette.brassLight, color: palette.forest }}>
          <ScanSearch size={14} />
          <span>Drag a box over (or click) any particular section of the PDF to zoom in and out. Press Esc to cancel.</span>
        </div>
      )}

      {warning && (
        <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ backgroundColor: palette.burgundy, color: palette.cream }}>
          <ShieldAlert size={15} strokeWidth={1.8} /> That action is disabled while reading.
        </div>
      )}

      {paceWarning && (
        <div className="flex items-center gap-2 justify-center py-2 text-xs font-semibold animate-pulse" style={{ backgroundColor: "#991B1B", color: palette.cream }}>
          <ShieldAlert size={14} strokeWidth={2} /> Reading pace limit reached: rapid automated page turning detected. Reading will resume shortly.
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          ref={pageBoxRef}
          onPointerDown={handlePagePointerDown}
          onPointerMove={handlePagePointerMove}
          onPointerUp={handlePagePointerUp}
          onPointerCancel={handlePagePointerUp}
          onDragStart={(e) => e.preventDefault()}
          className={`no-select select-none relative rounded-md shadow-2xl overflow-hidden flex flex-col items-center ${
            sectionSelectActive && book.pdfUrl ? "cursor-crosshair touch-none" : ""
          }`}
          style={{ backgroundColor: palette.cream, minHeight: 460, ...fontBody, color: palette.ink }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Repeating watermark overlay (College Name & Access Date - Zero Student PII) */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.09] flex flex-wrap content-start gap-12 p-6 z-50 select-none"
            aria-hidden="true"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="text-xs font-bold tracking-wider whitespace-nowrap" style={{ transform: "rotate(-22deg)", color: palette.ink }}>
                {watermarkText}
              </span>
            ))}
          </div>

          {selectionRect && (
            <div
              className="pointer-events-none absolute z-40 border-2 border-dashed border-[#D97706] bg-[#FDD132]/25 rounded-sm"
              style={{
                left: selectionRect.left,
                top: selectionRect.top,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}

          {book.pdfUrl ? (
            <div className="w-full h-full flex items-center justify-center pointer-events-none">
              <Document 
                file={cdnPdfUrl || book.pdfUrl} 
                onLoadSuccess={({ numPages }) => setNumPdfPages(numPages)}
                loading={
                  <div className="py-20 px-8 flex items-center justify-center">
                    <BookLoader book={book} message={isLoadingPdfUrl ? "Establishing secure CDN edge connection..." : "Loading secure PDF document..."} size="md" />
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
            <div className="relative whitespace-pre-line leading-relaxed text-[0.98rem] p-10 w-full max-w-2xl">
              {book.pages[page]}
            </div>
          )}
        </div>
      </div>

      {sectionCrop && book.pdfUrl && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[90vh]" style={{ backgroundColor: palette.forest2 }}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/15" style={{ backgroundColor: palette.forest }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: palette.brassLight }}>
                <ScanSearch size={16} />
                <span>Section Zoom — Page {pdfPageNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1 border border-white/15 bg-black/25">
                <button
                  type="button"
                  onClick={handleSectionZoomOut}
                  disabled={sectionZoom <= MIN_SECTION_ZOOM}
                  title="Zoom out selected section"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold hover:bg-white/10 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                  style={{ color: palette.cream }}
                >
                  <ZoomOut size={14} /> Zoom Out
                </button>
                <span className="px-2 text-xs font-bold min-w-[48px] text-center" style={{ color: palette.brassLight }}>
                  {Math.round(sectionZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleSectionZoomIn}
                  disabled={sectionZoom >= MAX_SECTION_ZOOM}
                  title="Zoom in selected section"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold hover:bg-white/10 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                  style={{ color: palette.cream }}
                >
                  <ZoomIn size={14} /> Zoom In
                </button>
                <div className="w-px h-4 bg-white/15 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setSectionZoom(sectionCrop.defaultZoom)}
                  title="Reset section zoom"
                  className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
                  style={{ color: palette.cream }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleCloseSectionZoom}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-white/10 hover:bg-white/20 cursor-pointer"
                style={{ color: palette.cream }}
              >
                <X size={14} /> Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 flex">
              <div
                className="m-auto no-select select-none relative rounded-md shadow-2xl overflow-hidden shrink-0"
                style={{
                  width: sectionCropWidth,
                  height: sectionCropHeight,
                  backgroundColor: palette.cream,
                }}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              >
                {/* Security watermark over zoomed section */}
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.09] flex flex-wrap content-start gap-10 p-4 z-50 select-none"
                  aria-hidden="true"
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="text-xs font-bold tracking-wider whitespace-nowrap" style={{ transform: "rotate(-22deg)", color: palette.ink }}>
                      {watermarkText}
                    </span>
                  ))}
                </div>

                <div
                  className="pointer-events-none"
                  style={{
                    position: "absolute",
                    left: -sectionCropLeft,
                    top: -sectionCropTop,
                    width: renderedSectionWidth,
                    height: renderedSectionHeight,
                  }}
                >
                  <Document file={cdnPdfUrl || book.pdfUrl} loading={null}>
                    <Page
                      pageNumber={pdfPageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={renderedSectionWidth}
                      loading={null}
                    />
                  </Document>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 py-4" style={{ backgroundColor: palette.forest }}>
        <Button variant="outlineLight" size="sm" onClick={prev} disabled={book.pdfUrl ? pdfPageNumber === 1 : page === 0}>
          <ChevronLeft size={16} strokeWidth={1.8} /> Previous
        </Button>
        
        <div className="flex items-center gap-2">
          <input 
            type="number"
            className="w-14 px-2 py-1 text-center text-sm rounded bg-white text-black outline-none border-2 border-transparent focus:border-[#FDD132] transition-colors"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onBlur={handleJump}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJump();
            }}
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(251,247,236,0.7)" }}>
            of {totalPages || "?"}
          </span>
        </div>

        <Button variant="brass" size="sm" onClick={next} disabled={book.pdfUrl ? pdfPageNumber === totalPages : page === totalPages - 1}>
          Next <ChevronRight size={16} strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  );
}
