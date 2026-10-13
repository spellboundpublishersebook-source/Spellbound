const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// I will find the start of the Right Content - Books Grid and fix all tags to the end of the file.
const regex = /\{\/\* Right Content \- Books Grid \*\/\}.*$/s;

const newEnd = `{/* Right Content - Books Grid */}
              <div className="flex-1">
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
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                      >
                        <div 
                          className="w-full aspect-[2/3] rounded-lg mb-4 bg-cover bg-center shadow-inner relative overflow-hidden" 
                          style={{ 
                            backgroundColor: b.color || '#f1f1f1', 
                            backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? \`url(\${b.coverUrl})\` : 'none'
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
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}`;

content = content.replace(regex, newEnd);
fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
