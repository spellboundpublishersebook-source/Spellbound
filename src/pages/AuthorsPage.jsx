import React from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { fontDisplay } from "../theme";

export default function AuthorsPage({ books, featuredAuthors = [], onNavigate }) {
  // Get unique authors from all books
  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();

  return (
    <div className="min-h-[calc(100vh-64px)] admin-glass-backdrop py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="admin-glass-panel rounded-[26px] text-[#111214] py-8 px-6 sm:px-8">
          <button 
            type="button"
            onClick={() => onNavigate("catalog")} 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full bg-white/75 hover:bg-[#111214] hover:text-[#F5F23B] border border-white transition-all cursor-pointer mb-5"
          >
            <ArrowLeft size={15} /> Back to Catalog
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={fontDisplay}>All Authors</h1>
          <p className="text-slate-700 max-w-2xl text-base">Browse our complete directory of featured and contributing authors.</p>
        </section>

        <section className="admin-glass-shell rounded-[26px] p-6 sm:p-8">
          <div className="flex flex-wrap gap-6 md:gap-8 justify-center md:justify-start">
            {allAuthors.map((authorRaw, idx) => {
              const author = String(authorRaw || "");
              const words = author.split(/[\s,-]+/).filter(Boolean);
              const initials = words.length > 1 
                ? (words[0][0] + words[1][0]).toUpperCase() 
                : (words[0] ? words[0][0].toUpperCase() : '');
                
              const featured = featuredAuthors.find(a => a?.name?.toLowerCase() === author.toLowerCase());
              const hasPhoto = featured && featured.photoUrl;
                
              return (
                <div 
                  key={idx} 
                  className="admin-glass-panel rounded-2xl p-4 w-[144px] flex flex-col items-center group cursor-pointer hover:scale-[1.03] transition-all"
                  onClick={() => {
                    localStorage.setItem("catalog_author_filter", author);
                    onNavigate("catalog");
                  }}
                >
                  <div 
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-[#111214] shadow-sm mb-3 border-2 border-white ${!hasPhoto ? 'bg-gradient-to-tr from-[#F5F23B]/70 to-amber-200/80' : 'bg-cover bg-center'}`}
                    style={hasPhoto ? { backgroundImage: `url(${featured.photoUrl})` } : {}}
                  >
                    {!hasPhoto && initials}
                  </div>
                  <p className="font-bold text-xs text-center text-[#111214] group-hover:underline transition-colors line-clamp-2">{author}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
