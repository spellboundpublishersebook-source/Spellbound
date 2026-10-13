import React, { useState, useEffect, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { fontDisplay } from "../theme";

export default function BookCover({ 
  book, 
  className = "", 
  titleClassName = "", 
  authorClassName = ""
}) {
  const [hasError, setHasError] = useState(false);

  // Extract valid cover URL
  const coverUrl = useMemo(() => {
    if (!book) return null;
    const raw = (book.coverUrl || book.coverurl || "").toString().trim();
    if (!raw || raw === "null" || raw === "undefined" || raw === "none") return null;
    return raw;
  }, [book?.coverUrl, book?.coverurl]);

  // Reset error state whenever book or URL changes
  useEffect(() => {
    setHasError(false);
  }, [book?.id, coverUrl]);

  const title = book?.title || "Untitled Book";
  const author = book?.author || "Spellbound Publishing";
  const bgColor = (book?.color && book.color !== "transparent" && book.color !== "#ffffff") 
    ? book.color 
    : "#5A3B2E";

  const showImage = Boolean(coverUrl) && !hasError;

  return (
    <div
      className={`relative select-none overflow-hidden flex flex-col items-center justify-center text-center ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* 1. REAL BOOK COVER ARTWORK (Displays immediately whenever cover URL is provided) */}
      {showImage ? (
        <img
          src={coverUrl}
          alt={title}
          loading="eager"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center block"
        />
      ) : (
        /* 2. FALLBACK STYLING ONLY WHEN BOOK HAS NO COVER IMAGE OR IMAGE 404s (NEVER BLANK) */
        <div className="absolute inset-0 flex flex-col items-center justify-between p-3 text-white overflow-hidden pointer-events-none">
          {/* Subtle textured shading */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-white/10" />
          
          {/* Spine crease shadow on left */}
          <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10" />
          
          {/* Embossed inner border */}
          <div className="absolute inset-2 border border-white/20 rounded z-10" />

          {/* Fallback Title & Author */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-1 px-1">
            <div className="flex items-center gap-1 opacity-80 pt-1">
              <BookOpen size={11} className="text-[#FDD132]" />
              <span className="text-[8px] uppercase tracking-widest font-semibold text-white/90">SPELLBOUND</span>
            </div>

            <div className="my-auto px-1 w-full max-w-full">
              <h3 
                className={`text-white font-bold leading-tight line-clamp-3 text-xs sm:text-sm drop-shadow-md ${titleClassName}`}
                style={{ ...fontDisplay, textShadow: "1px 1px 3px rgba(0,0,0,0.85)" }}
                title={title}
              >
                {title}
              </h3>
              <div className="w-8 h-0.5 bg-[#FDD132]/70 mx-auto my-1.5 rounded-full" />
              <p 
                className={`text-white/85 text-[10px] sm:text-xs truncate font-medium ${authorClassName}`}
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.85)" }}
                title={author}
              >
                {author}
              </p>
            </div>

            <div className="text-[8px] uppercase tracking-wider text-white/60 pb-0.5">
              Digital Library Edition
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
