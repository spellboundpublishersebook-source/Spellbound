const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Fix the scrollable book list container - merge double classNames
content = content.replace(
  `<div className="rounded-md border max-h-52 overflow-y-auto mb-4" className="border-gray-200">`,
  `<div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto mb-4">`
);

// Fix label rows in that list
content = content.replace(
  `<label key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm border-b cursor-pointer" className="border-gray-200">`,
  `<label key={b.id} className="flex items-center gap-3 px-3 py-2.5 text-sm border-b border-gray-100 cursor-pointer hover:bg-gray-50">`
);

// Fix "No matches" div
content = content.replace(
  `<div className="px-3 py-4 text-sm" className="text-gray-500">No matches.</div>`,
  `<div className="px-3 py-6 text-sm text-center text-gray-400">No matches found.</div>`
);

// Fix filter bar search input container
content = content.replace(
  `<div className="flex items-center gap-2 flex-1 rounded border px-2.5 min-w-[150px]" className="border-gray-200 bg-white">`,
  `<div className="flex items-center gap-2 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 min-w-[150px]">`
);

// Fix select dropdowns - merge double className
content = content.replace(
  /className="rounded border px-2 text-sm max-w-\[120px\]" className="border-gray-200"/g,
  'className="rounded-lg border border-gray-200 px-2 py-2 text-sm"'
);

// Fix "Select books" label double className
content = content.replace(
  `<label className="text-sm font-semibold" className="text-gray-500">`,
  `<label className="text-sm font-semibold text-gray-600">`
);

// Fix No institutions tr double className
content = content.replace(
  `<tr><td colSpan={7} className="px-4 py-6 text-center" className="text-gray-500">No institutions yet.</td></tr>`,
  `<tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No institutions yet.</td></tr>`
);

// Fix Resend Email button double className
content = content.replace(
  `className="text-xs font-semibold flex items-center gap-1" className="text-[#D4A017] hover:text-[#b8860b] transition-colors"`,
  `className="text-xs font-semibold flex items-center gap-1 text-[#D4A017] hover:text-[#b8860b]"`
);

// Fix Edit Access button double className
content = content.replace(
  `className="text-xs font-semibold" className="text-gray-500 uppercase tracking-wider text-xs"`,
  `className="text-xs font-semibold text-gray-500 uppercase tracking-wider"`
);

// Fix Toggle Status button double className
content = content.replace(
  `className="text-[11px] font-semibold uppercase tracking-wider" className={isOffline ? "text-green-600 hover:text-green-800 transition-colors" : "text-yellow-600 hover:text-yellow-800 transition-colors"}`,
  `className={\`text-[11px] font-semibold uppercase tracking-wider \${isOffline ? "text-green-600" : "text-yellow-600"}\`}`
);

// Fix Revoke button double className
content = content.replace(
  `className="text-[11px] font-semibold uppercase tracking-wider" className="text-red-600 hover:text-red-800 transition-colors"`,
  `className="text-[11px] font-semibold uppercase tracking-wider text-red-600"`
);

// Fix "Select books" label className in the form
content = content.replace(
  `<label className="text-sm font-semibold text-gray-600">\n                  Select books for this bundle`,
  `<span className="text-sm font-semibold text-gray-600">Select books for this bundle`
);
content = content.replace(
  `                </label>\n                <div className="flex gap-3">`,
  `                </span>\n                <div className="flex gap-3">`
);

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
console.log("Done");
