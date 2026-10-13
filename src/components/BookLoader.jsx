import React, { useState, useEffect } from "react";
import { fontDisplay, fontBody } from "../theme";

const DEFAULT_MESSAGES = [
  "Preparing digital manuscript...",
  "Decrypting encrypted pages...",
  "Rendering high-resolution typography...",
  "Calibrating secure reader..."
];

export default function BookLoader({ 
  book, 
  message, 
  subMessage,
  size = "md", 
  fullScreen = false, 
  dark = false,
  className = "" 
}) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return; // If explicit message provided, don't cycle
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [message]);

  const activeMessage = message || DEFAULT_MESSAGES[msgIndex];

  // Scale settings based on size prop
  const scale = size === "sm" ? 0.65 : size === "lg" ? 1.25 : 1.0;

  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 select-none ${
        fullScreen ? "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" : ""
      } ${className}`}
      style={fontBody}
    >
      <style>{`
        @keyframes pageFlip1 {
          0% { transform: rotateY(0deg); opacity: 0.95; }
          45% { opacity: 1; }
          100% { transform: rotateY(-180deg); opacity: 0.85; }
        }
        @keyframes pageFlip2 {
          0% { transform: rotateY(0deg); opacity: 0.95; }
          45% { opacity: 1; }
          100% { transform: rotateY(-180deg); opacity: 0.85; }
        }
        @keyframes pageFlip3 {
          0% { transform: rotateY(0deg); opacity: 0.95; }
          45% { opacity: 1; }
          100% { transform: rotateY(-180deg); opacity: 0.85; }
        }
        @keyframes goldShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes ribbonGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* 3D Animated Book */}
      <div 
        className="relative"
        style={{
          width: "96px",
          height: "68px",
          perspective: "700px",
          transform: `scale(${scale})`,
          transformOrigin: "center center"
        }}
      >
        {/* Soft shadow under the book */}
        <div 
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4/5 h-2.5 rounded-full blur-[5px] pointer-events-none"
          style={{
            backgroundColor: dark ? "rgba(0,0,0,0.6)" : "rgba(36,26,20,0.18)"
          }}
        />

        {/* Left Base Page */}
        <div 
          className="absolute top-0 left-0 w-[47px] h-[66px] rounded-l-sm border-r border-[#e5dfd3] shadow-sm flex flex-col justify-between p-1.5 overflow-hidden"
          style={{
            backgroundColor: "#FDFBF7"
          }}
        >
          {/* Faint printed manuscript lines */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-4/5" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-full" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-5/6" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-full" />
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-2/3" />
          </div>
          <div className="flex justify-between items-center text-[5px] text-[#b0a794] font-serif px-0.5">
            <span>•</span>
            <span>§</span>
          </div>
        </div>

        {/* Right Base Page */}
        <div 
          className="absolute top-0 right-0 w-[47px] h-[66px] rounded-r-sm border-l border-[#e5dfd3] shadow-sm flex flex-col justify-between p-1.5 overflow-hidden"
          style={{
            backgroundColor: "#FDFBF7"
          }}
        >
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-full" />
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-4/5" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-full" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-3/4" />
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-5/6" />
          </div>
          <div className="flex justify-end text-[5px] text-[#b0a794] font-serif px-0.5">
            <span>¶</span>
          </div>
        </div>

        {/* Flipping Leaf 1 */}
        <div 
          className="absolute top-0 right-0 w-[47px] h-[66px] rounded-r-sm border-l border-[#ded8c8] shadow-md p-1.5 overflow-hidden"
          style={{
            backgroundColor: "#FAF7EE",
            transformOrigin: "left center",
            animation: "pageFlip1 1.6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite",
            animationDelay: "0.0s",
            left: "48px"
          }}
        >
          <div className="flex flex-col gap-1.5 pt-1 opacity-70">
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-full" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-3/4" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-5/6" />
          </div>
        </div>

        {/* Flipping Leaf 2 */}
        <div 
          className="absolute top-0 right-0 w-[47px] h-[66px] rounded-r-sm border-l border-[#ded8c8] shadow-md p-1.5 overflow-hidden"
          style={{
            backgroundColor: "#FAF7EE",
            transformOrigin: "left center",
            animation: "pageFlip2 1.6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite",
            animationDelay: "0.38s",
            left: "48px"
          }}
        >
          <div className="flex flex-col gap-1.5 pt-1 opacity-70">
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-4/5" />
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-full" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-2/3" />
          </div>
        </div>

        {/* Flipping Leaf 3 */}
        <div 
          className="absolute top-0 right-0 w-[47px] h-[66px] rounded-r-sm border-l border-[#ded8c8] shadow-md p-1.5 overflow-hidden"
          style={{
            backgroundColor: "#FAF7EE",
            transformOrigin: "left center",
            animation: "pageFlip3 1.6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite",
            animationDelay: "0.76s",
            left: "48px"
          }}
        >
          <div className="flex flex-col gap-1.5 pt-1 opacity-70">
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-5/6" />
            <div className="h-0.5 bg-[#e8e2d4] rounded-full w-full" />
            <div className="h-0.5 bg-[#dcd5c5] rounded-full w-4/5" />
          </div>
        </div>

        {/* Central Book Spine with Golden Accent */}
        <div 
          className="absolute top-0 bottom-0 z-30 rounded-full"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: "3px",
            backgroundColor: "#D4A017",
            boxShadow: "0 0 8px rgba(212, 160, 23, 0.5)"
          }}
        />

        {/* Gold Bookmark Ribbon */}
        <div 
          className="absolute top-0 z-40"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "18px",
            backgroundColor: "#FDD132",
            borderRadius: "0 0 2px 2px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            animation: "ribbonGlow 2s ease-in-out infinite"
          }}
        />
      </div>

      {/* Book Metadata Context (if provided) */}
      {book && (
        <div className="mt-5 text-center max-w-sm px-4">
          <h4 
            className={`font-bold text-sm md:text-base leading-tight truncate ${
              dark ? "text-white" : "text-gray-900"
            }`}
            style={fontDisplay}
            title={book.title}
          >
            {book.title}
          </h4>
          {book.author && (
            <p className={`text-xs mt-0.5 truncate ${dark ? "text-gray-400" : "text-gray-600"}`}>
              by {book.author}
            </p>
          )}
        </div>
      )}

      {/* Slim Elegant Gold Loading Bar */}
      <div 
        className="w-36 md:w-44 h-1 rounded-full overflow-hidden relative mt-4"
        style={{
          backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
        }}
      >
        <div 
          className="absolute top-0 bottom-0 w-20 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #FDD132, #D4A017, transparent)",
            animation: "goldShimmer 1.4s ease-in-out infinite"
          }}
        />
      </div>

      {/* Status Message */}
      <div className="mt-3 text-center">
        <p 
          className={`text-xs font-medium tracking-wide transition-opacity duration-300 ${
            dark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {activeMessage}
        </p>
        {subMessage && (
          <p className={`text-[11px] mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
