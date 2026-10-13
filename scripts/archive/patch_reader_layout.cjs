const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

const replacement = `
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
                      <span className="text-gray-600 group-hover:text-black text-sm transition-colors">eBook</span>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[32px] text-center">{myBooksRaw.length}</span>
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
                          <span className="text-sm text-gray-600 truncate group-hover:text-black transition-colors" title={g}>
                            {g}
                          </span>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">
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
                          <span className="text-sm text-gray-600 truncate group-hover:text-black transition-colors" title={a}>
                            {a}
                          </span>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">
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
                    <p className="text-gray-500 font-semibold">No books found matching your filters.</p>
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
                          className="w-full aspect-[2/3] rounded-lg mb-4 bg-cover bg-center shadow-inner relative overflow-hidden" 
                          style={{ 
                            backgroundColor: b.color || '#f1f1f1', 
                            backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? \`url(\${b.coverUrl})\` : 'none'
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
                        <p className="text-xs text-gray-500 mt-1 truncate">{b.author}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-500 group-hover:text-black transition-colors">
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
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <button onClick={() => setSelectedGenres([])} className="text-sm font-semibold text-gray-800 hover:text-black hover:underline mb-6 block">
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
                      <span className="text-sm text-gray-700 truncate group-hover:text-black transition-colors" title={g}>{g.length > 35 ? g.substring(0, 32) + "..." : g}</span>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">{genreCounts[g] || 0}</span>
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
              <button onClick={() => setShowAuthorModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <button onClick={() => setSelectedAuthors([])} className="text-sm font-semibold text-gray-800 hover:text-black hover:underline mb-6 block">
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
                      <span className="text-sm text-gray-700 truncate group-hover:text-black transition-colors" title={a}>{a.length > 35 ? a.substring(0, 32) + "..." : a}</span>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-2">{authorCounts[a] || 0}</span>
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
`;

content = content.replace(/\{\/\* Main Layout \*\/\}[\s\S]*?(?=<\/div>\n    <\/div>\n  \);\n})/g, replacement);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Patched Layout');
