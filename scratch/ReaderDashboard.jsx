import React, { useState, useMemo } from "react";
import { Clock, AlertTriangle, Search, BookOpen, ChevronRight } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { daysUntil } from "../data/mockData";

export default function ReaderDashboard({ session, books, onOpenBook }) {
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");

  const myBooksRaw = session.bookIds === "all" ? books : books.filter((b) => (Array.isArray(session.bookIds) ? session.bookIds : []).includes(b.id));
  
  const myBooks = useMemo(() => {
    return myBooksRaw.filter(b => {
      const q = query.toLowerCase();
      const matchesQ = !q || (b.title && b.title.toLowerCase().includes(q)) || (b.author && b.author.toLowerCase().includes(q));
      const matchesG = genreFilter === "All" || b.genre === genreFilter;
      return matchesQ && matchesG;
    });
  }, [myBooksRaw, query, genreFilter]);

  const allGenres = ["All", ...Array.from(new Set(myBooksRaw.map(b => b.genre).filter(Boolean))).sort()];

  const daysLeft = daysUntil(session.endDate);
  const expiringSoon = daysLeft <= 15 && daysLeft > 0;
  const expired = daysLeft < 0;

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-[#131313]" style={fontBody}>
      {/* Header */}
      <div className="bg-[#111111] text-white pt-12 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="inline-block px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-gray-700">
                Reader Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3" style={fontDisplay}>
                {session.name}'s Library
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                {session.type === "trial"
                  ? "Free trial account — full catalog access until your trial ends."
                  : `Licensed titles for ${session.name}, term ${session.startDate} to ${session.endDate}.`}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              {expired ? (
                <div className="flex items-center gap-2 bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg font-semibold text-sm">
                  <AlertTriangle size={16} /> Access expired
                </div>
              ) : expiringSoon ? (
                <div className="flex items-center gap-2 bg-yellow-900/50 text-[#FDD132] border border-yellow-900/50 px-4 py-2 rounded-lg font-semibold text-sm">
                  <Clock size={16} /> {daysLeft} days left
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-800 text-green-400 border border-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">
                  <Clock size={16} /> Active until {session.endDate}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-20">
        
        {expired ? (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Period Ended</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">This access period has ended. Contact the publisher to renew and restore reading access.</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search your library..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64">
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                >
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onOpenBook(b.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                >
                  <div 
                    className="w-full aspect-[2/3] rounded-lg mb-4 bg-cover bg-center shadow-inner relative overflow-hidden" 
                    style={{ 
                      backgroundColor: b.color || '#f1f1f1', 
                      backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                    }} 
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="bg-[#FDD132] text-black w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all shadow-lg">
                        <BookOpen size={18} />
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#FDD132] mb-1">{b.genre}</span>
                  <h3 className="font-bold text-sm leading-tight line-clamp-2" style={fontDisplay}>{b.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">{b.author}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-black transition-colors">
                    <span>Read now</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
              {myBooks.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No books found matching your filters.</p>
                  <button onClick={() => { setQuery(""); setGenreFilter("All"); }} className="mt-4 text-[#FDD132] font-semibold hover:underline">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
