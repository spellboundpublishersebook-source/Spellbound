import React, { useState, useMemo } from "react";
import { Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft, X, User, Mail, Building2 } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { daysUntil } from "../data/mockData";

export default function ReaderDashboard({ session, books, onOpenBook }) {
    const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState(false); // true if eBook selected

    
  const myBooksRaw = session.bookIds === "all" ? books : books.filter((b) => (Array.isArray(session.bookIds) ? session.bookIds : []).includes(b.id));
  
  const myBooks = useMemo(() => {
    return myBooksRaw.filter(b => {
            const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      const matchesA = selectedAuthors.length === 0 || selectedAuthors.includes(b.author);
      // Assuming all are eBooks for now, so typeFilter doesn't strict filter unless we want it to
      return matchesG && matchesA;
    });
  }, [myBooksRaw, selectedGenres]);

  const genreCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach(b => {
      if (b.genre) counts[b.genre] = (counts[b.genre] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);
  const authorCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach(b => {
      if (b.author) counts[b.author] = (counts[b.author] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);
  
  const allGenres = Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort();
  const allAuthorsList = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();

  const daysLeft = daysUntil(session.endDate);
  const expiringSoon = daysLeft <= 15 && daysLeft > 0;
  const expired = daysLeft < 0;
  
  const curatedBooks = useMemo(() => {
    return [...myBooksRaw].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [myBooksRaw]);
  
  const [curatedIndex, setCuratedIndex] = useState(0);

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-[#131313]" style={fontBody}>
      {/* Header */}
      <div className="bg-white text-black border-b border-gray-200 pt-8 pb-24 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="inline-block px-3 py-1 bg-gray-100 text-black rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-gray-200">
                Reader Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" style={fontDisplay}>
                {session.name}'s Library
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 mt-4 text-sm text-black bg-gray-50 border border-gray-200 py-3 px-4 rounded-lg inline-flex">
                <span className="flex items-center gap-1.5"><User size={16} className="text-black" /> <span className="font-semibold text-black">ID:</span> {session.id}</span>
                {session.email && (
                  <span className="flex items-center gap-1.5"><Mail size={16} className="text-black" /> <span className="font-semibold text-black">Email:</span> {session.email}</span>
                )}
                {session.institution && session.institution !== session.name && (
                  <span className="flex items-center gap-1.5"><Building2 size={16} className="text-black" /> <span className="font-semibold text-black">Institution:</span> {session.institution}</span>
                )}
              </div>

              <p className="text-black text-sm md:text-base max-w-2xl">
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 -mt-12 relative z-20 pb-20">
        
        {expired ? (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Period Ended</h2>
            <p className="text-black mb-6 max-w-md mx-auto">This access period has ended. Contact the publisher to renew and restore reading access.</p>
          </div>
        ) : (
          <>

            {/* Curated For You */}
            {curatedBooks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-12 p-8 md:p-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-black mb-2 uppercase tracking-widest" style={fontDisplay}>
                      Curated For You
                    </h2>
                    <p className="text-black text-sm max-w-md">
                      Tailored to your reading history and preferences based on your past activity.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCuratedIndex(Math.max(0, curatedIndex - 1))}
                      disabled={curatedIndex === 0}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => setCuratedIndex(Math.min(curatedBooks.length - 1, curatedIndex + 1))}
                      disabled={curatedIndex >= curatedBooks.length - 1}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div className="flex w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${curatedIndex * 100}%)` }}>
                  {curatedBooks.map((b) => (
                    <div key={b.id} className="w-full flex-shrink-0 flex flex-col md:flex-row gap-8 items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div 
                        className="w-32 md:w-48 aspect-[2/3] rounded-lg shadow-2xl bg-[length:100%_100%] bg-center bg-no-repeat flex-shrink-0"
                        style={{ backgroundColor: b.color || '#333', backgroundImage: b.coverUrl ? `url(${b.coverUrl})` : 'none' }}
                      />
                      <div className="flex-1 text-left">
                        <span className="text-[#FDD132] text-xs font-bold uppercase tracking-wider mb-2 block">{b.genre}</span>
                        <h3 className="text-black text-2xl md:text-3xl font-bold mb-3 leading-tight" style={fontDisplay}>{b.title}</h3>
                        <p className="text-black text-sm mb-6 line-clamp-2">{b.author}</p>
                        <button 
                          onClick={() => onOpenBook(b.id)}
                          className="bg-[#FDD132] text-black font-bold px-6 py-3 rounded hover:bg-yellow-400 transition-colors"
                        >
                          Read Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            )}

            
            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
              
              {/* LEFT SIDEBAR */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-10">
                {/* TYPE */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4" style={fontDisplay}>Type</h3>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={typeFilter} onChange={e => setTypeFilter(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                      <span className="text-black group-hover:text-black text-sm transition-colors">eBook</span>
                    </div>
                    <span className="bg-gray-200 text-black text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[32px] text-center">{myBooksRaw.length}</span>
                  </label>
                </div>

                {/* CATEGORY */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4" style={fontDisplay}>Category</h3>
                  <div className="space-y-3 mb-4">
                    {allGenres.slice(0, 5).map(g => (
                      <label key={g} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input 
                            type="checkbox" 
                            checked={selectedGenres.includes(g)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                              else setSelectedGenres(selectedGenres.filter(x => x !== g));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-black truncate group-hover:text-black transition-colors" title={g}>
                            {g}
                          </span>
                        </div>
                        <span className="bg-gray-200 text-black text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">
                          {genreCounts[g] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allGenres.length > 5 && (
                    <button onClick={() => setShowCategoryModal(true)} className="text-xs font-bold uppercase tracking-wider text-black hover:underline">
                      + Show all category
                    </button>
                  )}
                </div>

                {/* AUTHOR */}
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase mb-4" style={fontDisplay}>Author</h3>
                  <div className="space-y-3 mb-4">
                    {allAuthorsList.slice(0, 5).map(a => (
                      <label key={a} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input 
                            type="checkbox" 
                            checked={selectedAuthors.includes(a)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                              else setSelectedAuthors(selectedAuthors.filter(x => x !== a));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-black truncate group-hover:text-black transition-colors" title={a}>
                            {a}
                          </span>
                        </div>
                        <span className="bg-gray-200 text-black text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">
                          {authorCounts[a] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                  {allAuthorsList.length > 5 && (
                    <button onClick={() => setShowAuthorModal(true)} className="text-xs font-bold uppercase tracking-wider text-black hover:underline">
                      + Show all author
                    </button>
                  )}
                </div>
              </div>
              
              {/* Right Content - Books Grid */}
              <div className="flex-1 w-full">
                {myBooks.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-black font-semibold">No books found matching your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myBooks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onOpenBook(b.id)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col  transition-[opacity,box-shadow] hover:-translate-y-1 cursor-pointer group"
                      >
                        <div 
                          className="w-full aspect-[2/3] rounded-lg mb-4 bg-[length:100%_100%] bg-center bg-no-repeat shadow-inner relative overflow-hidden" 
                          style={{ 
                            backgroundColor: b.color || '#f1f1f1', 
                            backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                          }} 
                        >
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="bg-[#FDD132] text-black w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-[opacity,box-shadow] shadow-lg">
                              <BookOpen size={18} />
                            </div>
                          </div>
                        </div>
                        
                        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FDD132] mb-1">{b.genre}</span>
                        <h3 className="font-bold text-sm leading-tight line-clamp-2" style={fontDisplay}>{b.title}</h3>
                        <p className="text-xs text-black mt-1 truncate">{b.author}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-black group-hover:text-black transition-colors">
                          <span>Read now</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={fontDisplay}>All Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-black hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <button onClick={() => setSelectedGenres([])} className="text-sm font-semibold text-black hover:text-black hover:underline mb-6 block">
                Select All
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                {allGenres.map(g => (
                  <label key={g} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input 
                        type="checkbox" 
                        checked={selectedGenres.includes(g) || selectedGenres.length === 0}
                        onChange={(e) => {
                          if (selectedGenres.length === 0) setSelectedGenres([g]);
                          else if (e.target.checked) setSelectedGenres([...selectedGenres, g]);
                          else setSelectedGenres(selectedGenres.filter(x => x !== g));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-black truncate group-hover:text-black transition-colors" title={g}>{g.length > 35 ? g.substring(0, 32) + "..." : g}</span>
                    </div>
                    <span className="bg-gray-200 text-black text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">{genreCounts[g] || 0}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowCategoryModal(false)} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {showAuthorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={fontDisplay}>All Authors</h2>
              <button onClick={() => setShowAuthorModal(false)} className="text-black hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <button onClick={() => setSelectedAuthors([])} className="text-sm font-semibold text-black hover:text-black hover:underline mb-6 block">
                Select All
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                {allAuthorsList.map(a => (
                  <label key={a} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input 
                        type="checkbox" 
                        checked={selectedAuthors.includes(a) || selectedAuthors.length === 0}
                        onChange={(e) => {
                          if (selectedAuthors.length === 0) setSelectedAuthors([a]);
                          else if (e.target.checked) setSelectedAuthors([...selectedAuthors, a]);
                          else setSelectedAuthors(selectedAuthors.filter(x => x !== a));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-black truncate group-hover:text-black transition-colors" title={a}>{a.length > 35 ? a.substring(0, 32) + "..." : a}</span>
                    </div>
                    <span className="bg-gray-200 text-black text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">{authorCounts[a] || 0}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowAuthorModal(false)} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}