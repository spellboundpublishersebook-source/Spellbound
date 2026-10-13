const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// 1. Add mobileFiltersOpen state right after existing states
content = content.replace(
  `  const [dateFrom, setDateFrom] = useState("");`,
  `  const [dateFrom, setDateFrom] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);`
);

// 2. Replace sidebar div with mobile-aware version - add toggle button + collapsible sidebar on mobile
content = content.replace(
  `        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
              Filters
            </div>`,
  `        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className="lg:w-1/4 flex-shrink-0">
            {/* Mobile filter toggle */}
            <button
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 font-bold text-sm text-gray-700 shadow-sm"
              onClick={() => setMobileFiltersOpen(o => !o)}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filters
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: mobileFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className={\`\${mobileFiltersOpen ? 'block' : 'hidden'} lg:block\`}>
            <div className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
              Filters
            </div>`
);

// 3. Close the extra div wrapper - find the end of the sidebar div and add closing tag
// The sidebar div ends where lg:w-3/4 begins
content = content.replace(
  `          </div>

          {/* RESULTS GRID */}
          <div className="lg:w-3/4">`,
  `          </div>{/* end mobile collapsible wrapper */}
          </div>

          {/* RESULTS GRID */}
          <div className="lg:w-3/4">`
);

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log("Done");
