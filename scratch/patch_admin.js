const fs = require('fs');
const file = 'src/pages/AdminPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update InstitutionsTab state
content = content.replace(
  'const [genreFilter, setGenreFilter] = useState("All");\n  const [issuedCreds, setIssuedCreds] = useState(null);',
  'const [genreFilter, setGenreFilter] = useState("All");\n  const [pubTypeFilter, setPubTypeFilter] = useState("All");\n  const [authorFilter, setAuthorFilter] = useState("All");\n  const [issuedCreds, setIssuedCreds] = useState(null);'
);

// Update filteredBooks in InstitutionsTab
content = content.replace(
  'const filteredBooks = useMemo(() => books.filter((b) =>\n    (genreFilter === "All" || b.genre === genreFilter) &&\n    (b.title || "").toLowerCase().includes((search || "").toLowerCase())\n  ), [books, search, genreFilter]);',
  `const filteredBooks = useMemo(() => books.filter((b) =>
    (genreFilter === "All" || b.genre === genreFilter) &&
    (pubTypeFilter === "All" || b.pubType === pubTypeFilter) &&
    (authorFilter === "All" || b.author === authorFilter) &&
    ((b.title || "").toLowerCase().includes((search || "").toLowerCase()) || (b.author || "").toLowerCase().includes((search || "").toLowerCase()))
  ), [books, search, genreFilter, pubTypeFilter, authorFilter]);`
);

// Add unique authors/pubtypes calculations
content = content.replace(
  'const [editLicenseId, setEditLicenseId] = useState(null);',
  `const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();
  const allPubTypes = Array.from(new Set(books.map(b => b.pubType).filter(Boolean))).sort();
  
  const [editLicenseId, setEditLicenseId] = useState(null);`
);

// Update InstitutionsTab UI buttons
content = content.replace(
  '<label className="text-sm font-semibold" style={{ color: palette.inkSoft }}>\n                  Select books for this bundle — {selected.length} of {books.length} selected\n                </label>',
  `<label className="text-sm font-semibold" style={{ color: palette.inkSoft }}>
                  Select books for this bundle — {selected.length} of {books.length} selected
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="text-xs text-blue-600 hover:underline">Select Filtered</button>
                  <button type="button" onClick={() => setSelected([])} className="text-xs text-red-600 hover:underline">Clear All</button>
                </div>`
);

// Update InstitutionsTab UI filters
content = content.replace(
  '<select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="rounded border px-2 text-sm" style={{ borderColor: palette.line }}>\n                  <option>All</option>\n                  {getGenres().map((g) => <option key={g}>{g}</option>)}\n                </select>\n              </div>',
  `<select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="rounded border px-2 text-sm flex-shrink-0" style={{ borderColor: palette.line }}>
                  <option value="All">All Genres</option>
                  {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="rounded border px-2 text-sm flex-shrink-0" style={{ borderColor: palette.line }}>
                  <option value="All">All Pub Types</option>
                  {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded border px-2 text-sm flex-shrink-0" style={{ borderColor: palette.line }}>
                  <option value="All">All Authors</option>
                  {allAuthors.map((a) => <option key={a} value={a}>{a.length > 20 ? a.substring(0,20)+"..." : a}</option>)}
                </select>
              </div>`
);

fs.writeFileSync(file, content);
