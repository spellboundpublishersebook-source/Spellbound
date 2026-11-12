import React, { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";

export default function StaticPage({ title, content, onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className="admin-glass-backdrop min-h-[calc(100vh-64px)] text-[#111214] pb-14" style={fontBody}>
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/80 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-700">
          <button type="button" onClick={() => onNavigate("catalog")} className="hover:text-[#111214] transition-colors flex items-center gap-1 font-semibold cursor-pointer">
            <ChevronLeft size={16} /> Back to Home
          </button>
          <span>/</span>
          <span className="text-[#111214] font-bold truncate">{title}</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <div className="admin-glass-shell rounded-[28px] p-7 sm:p-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-[#111214]" style={fontDisplay}>{title}</h1>
          <div className="prose max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
            {content || "This page is currently empty. An administrator can add content to this page via the Admin Dashboard."}
          </div>
        </div>
      </div>
    </div>
  );
}
