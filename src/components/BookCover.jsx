import React, { useState, useEffect, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { fontDisplay } from "../theme";

const DEFAULT_SPINE_COLORS = [
  "#2C3E50", "#8C3B3F", "#1F3A30", "#3A2E2B", 
  "#A97F45", "#4A3B30", "#16281F", "#6E2A34"
];

// Resolves candidate URLs to try for a book cover
function getCandidateUrls(book) {
  if (!book) return [];
  const raw = (book.coverUrl || book.coverurl || "").toString().trim();
  if (!raw || raw === "null" || raw === "undefined" || raw === "none") return [];

  const candidates = [raw];

  // If the cover points to an older or alternate Supabase project ID, try the current one as fallback
  if (raw.includes("cctdfzdcnunkiriwqnyn.supabase.co")) {
    candidates.push(raw.replace("cctdfzdcnunkiriwqnyn.supabase.co", "hmhbbwldajchdxjeidni.supabase.co"));
  } else if (raw.includes("hmhbbwldajchdxjeidni.supabase.co")) {
    candidates.push(raw.replace("hmhbbwldajchdxjeidni.supabase.co", "cctdfzdcnunkiriwqnyn.supabase.co"));
  }

  return candidates;
}

export default function BookCover({ 
  book, 
  className = "", 
  titleClassName = "", 
  authorClassName = "",
  showFallbackDetails = true 
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const candidateUrls = useMemo(() => getCandidateUrls(book), [book?.coverUrl, book?.coverurl]);

  // Reset state whenever book or cover URL changes
  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    setIsLoaded(false);
  }, [book?.id, book?.coverUrl, book?.coverurl]);

  const activeUrl = !hasError && candidateUrls.length > 0 ? candidateUrls[candidateIndex] : null;

  const handleImageError = () => {
    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Base fallback color - deterministic based on title if no color supplied
  const baseColor = useMemo(() => {
    if (book?.color && book.color !== "transparent" && book.color !== "#ffffff") {
      return book.color;
    }
    if (book?.title) {
      let hash = 0;
      for (let i = 0; i < book.title.length; i++) {
        hash = book.title.charCodeAt(i) + ((hash << 5) - hash);
      }
      return DEFAULT_SPINE_COLORS[Math.abs(hash) % DEFAULT_SPINE_COLORS.length];
    }
    return "#2C3E50";
  }, [book?.color, book?.title]);

  const title = book?.title || "Spellbound Title";
  const author = book?.author || "Spellbound Publishing";

  return (
    <div
      className={`relative select-none overflow-hidden flex flex-col items-center justify-between text-center ${className}`}
      style={{ backgroundColor: baseColor }}
    >
      {/* REAL COVER IMAGE (Fades in over fallback once loaded, never renders blank!) */}
      {activeUrl && !hasError && (
        <img
          src={activeUrl}
          alt={title}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`absolute inset-0 w-full h-full object-cover object-center z-10 transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* HARDCOVER / VINTAGE STYLING FOR FALLBACK (Always present underneath, never goes blank!) */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-between p-2.5 sm:p-3 text-white overflow-hidden pointer-events-none">
        {/* Leather/Cloth Grain Texture & Shading */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/25 to-white/10 opacity-90" />
        
        {/* Realistic Book Spine Crease & Shadow on Left Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-2.5 sm:w-3.5 bg-gradient-to-r from-black/60 via-black/25 to-transparent z-10 shadow-[inset_-1px_0_1px_rgba(255,255,255,0.15)]" />
        
        {/* Right Edge Page Block Sheen */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/30 to-transparent z-10" />

        {/* Embossed Inner Frame Border */}
        <div className="absolute inset-2 border border-white/20 rounded pointer-events-none z-10" />

        {showFallbackDetails && (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-1 px-1">
            {/* Top decorative header / emblem */}
            <div className="flex items-center gap-1 opacity-80 pt-1">
              <BookOpen size={12} className="text-[#FDD132]" />
              <span className="text-[9px] uppercase tracking-widest font-semibold text-white/90">SPELLBOUND</span>
            </div>

            {/* Book Title & Author in Center */}
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

            {/* Bottom Edition / Library Mark */}
            <div className="text-[8px] uppercase tracking-wider text-white/60 pb-0.5">
              Digital Library Edition
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
