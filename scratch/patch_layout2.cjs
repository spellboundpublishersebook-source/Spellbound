const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

const filterSectionStr = `            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search your library..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <select 
                  className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                >
                  <option value="All">All Genres</option>
                  {allGenres.filter(g => g !== "All").map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select 
                  className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                  value={pubTypeFilter}
                  onChange={(e) => setPubTypeFilter(e.target.value)}
                >
                  <option value="All">All Pub Types</option>
                  {allPubTypes.filter(p => p !== "All").map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select 
                  className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                >
                  <option value="All">All Authors</option>
                  {allAuthors.filter(a => a !== "All").map(a => <option key={a} value={a}>{a.length > 20 ? a.substring(0,20)+"..." : a}</option>)}
                </select>
              </div>
            </div>`;

const newLayout = `            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Sidebar Filters */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-5">
                  <h3 className="font-bold text-lg border-b border-gray-100 pb-3" style={fontDisplay}>Search & Filters</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search your library..." 
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Genre</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                    >
                      <option value="All">All Genres</option>
                      {allGenres.filter(g => g !== "All").map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Publication Type</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                      value={pubTypeFilter}
                      onChange={(e) => setPubTypeFilter(e.target.value)}
                    >
                      <option value="All">All Pub Types</option>
                      {allPubTypes.filter(p => p !== "All").map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Author</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FDD132]"
                      value={authorFilter}
                      onChange={(e) => setAuthorFilter(e.target.value)}
                    >
                      <option value="All">All Authors</option>
                      {allAuthors.filter(a => a !== "All").map(a => <option key={a} value={a}>{a.length > 20 ? a.substring(0,20)+"..." : a}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Content - Books Grid */}
              <div className="flex-1">
                {myBooks.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 font-semibold">No books found matching your filters.</p>
                  </div>
                ) : (
                  <div>`;

content = content.replace(filterSectionStr, newLayout);

// Now we need to add the closing tags correctly.
// The easiest way is to append `</div></div>` right before the end of the view `</>` block.
// Wait, the grid has its own closing div. Let's find exactly where to inject the closing divs.
// The file ends roughly like:
/*
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
*/
const oldEndStr = `            </div>
          </>
        )}
      </div>
    </div>
  );
}`;
const newEndStr = `            </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}`;

content = content.replace(oldEndStr, newEndStr);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
