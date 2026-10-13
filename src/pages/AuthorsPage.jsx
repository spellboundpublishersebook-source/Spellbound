import React from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { fontDisplay } from "../theme";

export default function AuthorsPage({ books, featuredAuthors = [], onNavigate }) {
  // Get unique authors from all books
  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FBF7EC]">
      <section className="bg-white text-black py-16 px-6">
        <div className="max-w-7xl mx-auto relative">
          <button 
            onClick={() => onNavigate("catalog")} 
            className="absolute -top-6 left-0 text-black hover:text-black flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} /> Back to Catalog
          </button>
          <h1 className="text-4xl font-bold mb-4 mt-8" style={fontDisplay}>All Authors</h1>
          <p className="text-black max-w-2xl text-lg">Browse our complete directory of featured and contributing authors.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-8 md:gap-12 justify-center md:justify-start py-4">
          {allAuthors.map((authorRaw, idx) => {
            const author = String(authorRaw || "");
            const words = author.split(/[\s,-]+/).filter(Boolean);
            const initials = words.length > 1 
              ? (words[0][0] + words[1][0]).toUpperCase() 
              : (words[0] ? words[0][0].toUpperCase() : '');
              
            // Check if this author is a featured author with a photo
            const featured = featuredAuthors.find(a => a?.name?.toLowerCase() === author.toLowerCase());
            const hasPhoto = featured && featured.photoUrl;
              
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center group cursor-pointer max-w-[140px]"
                onClick={() => {
                  localStorage.setItem("catalog_author_filter", author);
                  onNavigate("catalog");
                }}
              >
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-black shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all mb-3 border-4 border-white ${!hasPhoto ? 'bg-gradient-to-tr from-gray-200 to-gray-300' : 'bg-cover bg-center'}`}
                  style={hasPhoto ? { backgroundImage: `url(${featured.photoUrl})` } : {}}
                >
                  {!hasPhoto && initials}
                </div>
                <p className="font-semibold text-sm text-center group-hover:text-[#FDD132] transition-colors line-clamp-2">{author}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
