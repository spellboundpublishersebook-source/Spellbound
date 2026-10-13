import React from "react";
import { fontBody } from "../theme";

export function Field({ label, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <input
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <select
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function TextArea({ label, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <textarea
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none resize-y focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-gray-100 text-black border border-gray-200",
    good: "bg-green-100 text-green-700 border border-green-200",
    warn: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    bad: "bg-red-100 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-100 p-6 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFF9E6] text-[#FDD132] border border-[#FDEB9E]">
          <Icon size={24} strokeWidth={2} className="text-[#D4A017]" />
        </div>
      )}
      <div>
        <div className="text-3xl font-extrabold text-[#111111] leading-none mb-1">{value}</div>
        <div className="text-xs font-semibold text-black uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide, maxWidth = null }) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is active
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const widthClass = maxWidth 
    ? maxWidth 
    : wide 
      ? "max-w-2xl lg:max-w-3xl" 
      : "max-w-md";

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/65 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} flex flex-col max-h-[82vh] sm:max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title and Prominent, Always-Visible Close Button */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50/95 backdrop-blur-sm z-20">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#111111] truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-black bg-white hover:bg-gray-100 active:scale-95 px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm transition-all duration-150 cursor-pointer flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Close</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-black">
          {children}
        </div>
      </div>
    </div>
  );
}
