const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Replace the ugly flex-wrap filter bar with a clean 2-row grid
const oldFilterBar = `              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 min-w-[150px]">
                  <Search size={14} className="text-gray-500" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles or authors"
                    className="flex-1 py-2 text-sm outline-none border-none"
                  />
                </div>
                <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <option value="All">All Genres</option>
                  {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <option value="All">All Pub Types</option>
                  {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <option value="All">All Authors</option>
                  {allAuthors.map((a) => <option key={a} value={a}>{a.length > 15 ? a.substring(0,15)+"..." : a}</option>)}
                </select>
              </div>`;

const newFilterBar = `              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
                  <Search size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles or authors…"
                    className="flex-1 py-2.5 text-sm outline-none bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700 bg-white">
                    <option value="All">All Genres</option>
                    {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700 bg-white">
                    <option value="All">All Pub Types</option>
                    {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700 bg-white">
                    <option value="All">All Authors</option>
                    {allAuthors.map((a) => <option key={a} value={a}>{a.length > 18 ? a.substring(0,18)+"…" : a}</option>)}
                  </select>
                </div>
              </div>`;

if (content.includes(oldFilterBar)) {
  content = content.replace(oldFilterBar, newFilterBar);
  console.log("Replaced filter bar");
} else {
  console.log("Filter bar not found exactly - trying partial match");
}

// Upgrade the book list to clean rows with selected highlight
const oldList = `<div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto mb-4">
                {filteredBooks.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 px-3 py-2.5 text-sm border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />
                    <span 
                      className="w-5 h-7 rounded-sm flex-shrink-0 bg-cover bg-center shadow-sm" 
                      style={{ 
                        backgroundColor: b.color,
                        backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? \`url(\${b.coverUrl})\` : 'none'
                      }} 
                    />
                    <span className="flex-1">{b.title}</span>
                    <span className="text-gray-500">{b.genre}</span>
                  </label>
                ))}
                <div className="px-3 py-6 text-sm text-center text-gray-400">No matches found.</div>
              </div>`;

const newList = `<div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
                <div className="max-h-60 overflow-y-auto">
                  {filteredBooks.map((b) => (
                    <label key={b.id} className={\`flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 cursor-pointer \${selected.includes(b.id) ? 'bg-yellow-50 border-l-2 border-l-[#FDD132]' : 'hover:bg-gray-50'}\`}>
                      <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} className="rounded" />
                      <div
                        className="w-6 h-9 rounded flex-shrink-0 bg-cover bg-center"
                        style={{
                          backgroundColor: b.color,
                          backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? \`url(\${b.coverUrl})\` : 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{b.title}</div>
                        <div className="text-xs text-gray-400 truncate">{b.author}</div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">{b.genre}</span>
                    </label>
                  ))}
                  {filteredBooks.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-400">No books match the filters.</div>
                  )}
                </div>
              </div>`;

content = content.replace(oldList, newList);

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
console.log("Done");
