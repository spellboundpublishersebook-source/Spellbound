import React, { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";

export default function StaticPage({ title, content, onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className="bg-[#f8f9fa] min-h-screen text-[#131313]" style={fontBody}>
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-black">
          <button onClick={() => onNavigate("catalog")} className="hover:text-black transition-colors flex items-center gap-1">
            <ChevronLeft size={16} /> Back to Home
          </button>
          <span>/</span>
          <span className="text-black font-semibold truncate">{title}</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8" style={fontDisplay}>{title}</h1>
        <div className="prose max-w-none text-black leading-relaxed whitespace-pre-wrap">
          {content || "This page is currently empty. An administrator can add content to this page via the Admin Dashboard."}
        </div>
      </div>
    </div>
  );
}
