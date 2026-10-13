import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert, Volume2, VolumeX } from "lucide-react";
import { palette, fontDisplay, fontBody } from "../theme";
import { supabase } from "../supabaseClient";
import Button from "../components/Button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import BookLoader from "../components/BookLoader";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecureReader({ book, session, onBack }) {
  const [page, setPage] = useState(0); // For text pages
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [warning, setWarning] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [jumpInput, setJumpInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

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
    localStorage.setItem(`last_read_book`, book.id);
  }, [currentPageDisplay, book.id]);

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
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
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
  }, [next, prev]);

  // Watermark college name and date without exposing individual student PII
  const collegeName = session?.institution || session?.name || "Licensed Institution";
  const accessDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const watermarkText = `${collegeName.toUpperCase()} • LICENSED ACCESS • ${accessDate}`;

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col relative" style={{ backgroundColor: palette.forest2 }}>
      
      {!isFocused && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <ShieldAlert size={48} className="text-white mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Reading Paused</h2>
          <p className="text-gray-300">Click anywhere to resume secure reading.</p>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: palette.forest }}>
        <button onClick={onBack} className="flex items-center gap-2 text-sm" style={{ color: palette.cream }}>
          <ArrowLeft size={16} strokeWidth={1.8} /> Back to library
        </button>
        <div className="text-sm text-center" style={{ ...fontDisplay, color: palette.brassLight }}>{book.title}</div>
        <div className="flex items-center justify-end gap-3 w-32">
          {!book.pdfUrl && (
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
          className="no-select relative rounded-md shadow-2xl overflow-hidden flex flex-col items-center"
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
                  width={600}
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
