const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// Replace state
content = content.replace(
  'const [genreFilter, setGenreFilter] = useState("All");',
  'const [selectedGenres, setSelectedGenres] = useState([]);'
);

// Replace filter logic
content = content.replace(
  'const matchesG = genreFilter === "All" || b.genre === genreFilter;',
  'const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);'
);
content = content.replace(
  '[myBooksRaw, query, genreFilter, authorFilter, pubTypeFilter]',
  '[myBooksRaw, query, selectedGenres, authorFilter, pubTypeFilter]'
);

// Remove the genre select from the sidebar
content = content.replace(
  /<div>\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Genre<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/,
  ''
);

// Compute genre counts and allGenres
content = content.replace(
  'const allGenres = ["All", ...Array.from(new Set(myBooksRaw.map(b => b.genre).filter(Boolean))).sort()];',
  `const genreCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach(b => {
      if (b.genre) counts[b.genre] = (counts[b.genre] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);
  const allGenres = Array.from(new Set(myBooksRaw.map(b => b.genre).filter(Boolean))).sort();`
);

// Insert the new grid before the books grid
const newGrid = `
                {/* Subject Filter Grid */}
                {allGenres.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={() => setSelectedGenres([])} 
                        className="text-sm font-semibold text-gray-800 hover:text-black hover:underline"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
                      {allGenres.map(g => (
                        <label key={g} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <input 
                              type="checkbox" 
                              checked={selectedGenres.includes(g) || selectedGenres.length === 0}
                              onChange={(e) => {
                                if (selectedGenres.length === 0) {
                                  // If "Select All" was active, clicking one should select ONLY that one
                                  setSelectedGenres([g]);
                                } else {
                                  if (e.target.checked) {
                                    setSelectedGenres([...selectedGenres, g]);
                                  } else {
                                    const next = selectedGenres.filter(x => x !== g);
                                    setSelectedGenres(next);
                                  }
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 truncate group-hover:text-black transition-colors" title={g}>
                              {g.length > 28 ? g.substring(0, 25) + "..." : g}
                            </span>
                          </div>
                          <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
                            {genreCounts[g]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
`;

content = content.replace(
  '{/* Right Content - Books Grid */}',
  '{/* Right Content - Books Grid */}\n' + newGrid
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Patched');
