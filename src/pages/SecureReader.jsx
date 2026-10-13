import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ShieldAlert, Volume2, VolumeX } from "lucide-react";
import { palette, fontDisplay, fontBody } from "../theme";
import { supabase } from "../supabaseClient";
import Button from "../components/Button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecureReader({ book, session, onBack }) {
  const [page, setPage] = useState(0); // For text pages
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [numPdfPages, setNumPdfPages] = useState(null);
  const [warning, setWarning] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [jumpInput, setJumpInput] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  useEffect(() => {
    // Only enforce seats for institutional licenses (not admins or independent readers)
    if (session.type !== "license") return;

    let heartbeatInterval;
    async function initSession() {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      // Clean up dead sessions
      await supabase.from('reading_sessions').delete().lt('last_active', fiveMinsAgo);

      // Check current sessions for this license
      const { data: activeSessions } = await supabase.from('reading_sessions').select('id').eq('license_id', session.id);
      
      const mySessionId = localStorage.getItem('reader_session_id') || `sess_${Date.now()}`;
      const isAlreadyReading = activeSessions?.find(s => s.id === mySessionId);

      // We need to know the seats limit, which we can fetch or pass down.
      // Since it's not passed, we fetch it quickly.
      const { data: licData } = await supabase.from('licenses').select('seats').eq('id', session.id).single();
      const maxSeats = licData ? licData.seats : 100;

      if (!isAlreadyReading && activeSessions && activeSessions.length >= maxSeats) {
        setIsBlocked(true);
        return;
      }

      // Upsert my session
      localStorage.setItem('reader_session_id', mySessionId);
      await supabase.from('reading_sessions').upsert({ id: mySessionId, license_id: session.id, book_id: book.id, last_active: new Date().toISOString() });
      
      if (!isAlreadyReading) {
        await supabase.from('book_views').insert([{ id: `v_${Date.now()}`, book_id: book.id, license_id: session.id, viewed_at: new Date().toISOString() }]);
      }

      // Heartbeat
      heartbeatInterval = setInterval(() => {
        supabase.from('reading_sessions').update({ last_active: new Date().toISOString() }).eq('id', mySessionId);
      }, 60000);
    }
    initSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [book.id, session]);

  // Sync jump input when page changes
  useEffect(() => {
    setJumpInput(currentPageDisplay.toString());
  }, [currentPageDisplay]);

  const handleJump = () => {
    let p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      if (book.pdfUrl) setPdfPageNumber(p);
      else setPage(p - 1);
    } else {
      setJumpInput(currentPageDisplay.toString());
    }
  };

  const next = useCallback(() => {
    if (book.pdfUrl) setPdfPageNumber(p => Math.min(p + 1, totalPages));
    else setPage(p => Math.min(p + 1, totalPages - 1));
  }, [totalPages, book.pdfUrl]);
  
  const prev = useCallback(() => {
    if (book.pdfUrl) setPdfPageNumber(p => Math.max(p - 1, 1));
    else setPage(p => Math.max(p - 1, 0));
  }, [book.pdfUrl]);

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

  const watermarkText = `Copyright by ${book.publisher || "Publisher"} - ${book.firstPublish ? book.firstPublish.slice(0, 4) : new Date().getFullYear()}`;

  if (isBlocked) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: palette.forest2, color: palette.cream }}>
        <ShieldAlert size={64} className="mb-6 opacity-50 text-red-500" />
        <h2 className="text-2xl font-bold mb-4" style={fontDisplay}>All Seats Currently in Use</h2>
        <p className="max-w-md text-sm mb-8" style={{ color: "rgba(251,247,236,0.7)" }}>
          Your institution's license allows a limited number of readers at the same time. The maximum number of active reading sessions has been reached. Please try again in a few minutes.
        </p>
        <Button variant="outlineLight" onClick={onBack}><ArrowLeft size={16} strokeWidth={1.8} /> Return to Library</Button>
      </div>
    );
  }

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

      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className="no-select relative rounded-md shadow-2xl overflow-hidden flex flex-col items-center"
          style={{ backgroundColor: palette.cream, minHeight: 460, ...fontBody, color: palette.ink }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Repeating watermark overlay */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08] flex flex-wrap content-start gap-8 p-4 z-50"
            aria-hidden="true"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="text-xs whitespace-nowrap" style={{ transform: "rotate(-18deg)", color: palette.ink }}>
                {watermarkText}
              </span>
            ))}
          </div>

          {book.pdfUrl ? (
            <div className="w-full h-full flex items-center justify-center pointer-events-none">
              <Document 
                file={book.pdfUrl} 
                onLoadSuccess={({ numPages }) => setNumPdfPages(numPages)}
                loading={<div className="p-20">Loading secure PDF...</div>}
                error={<div className="p-20 text-red-500">Error loading PDF. Make sure storage buckets are public.</div>}
              >
                <Page 
                  pageNumber={pdfPageNumber} 
                  renderTextLayer={false} 
                  renderAnnotationLayer={false}
                  width={600}
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
