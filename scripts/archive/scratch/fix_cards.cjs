const fs = require('fs');

// CatalogPage - apply book-card class, remove transition-shadow
let cat = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Main grid book cards
cat = cat.replace(
  /className="flex flex-col group cursor-pointer bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"/g,
  'className="book-card flex flex-col p-3"'
);

// New releases cards
cat = cat.replace(
  /className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"/g,
  'className="book-card p-4 flex gap-4"'
);

// Created for you cards
cat = cat.replace(
  /className="bg-white text-black rounded-xl p-4 flex gap-4 w-60 sm:w-72 flex-shrink-0 shadow-lg cursor-pointer hover:shadow-lg transition-shadow"/g,
  'className="book-card flex gap-4 w-60 sm:w-72 flex-shrink-0 p-4"'
);

// Remove any remaining transition-shadow
cat = cat.replace(/\s*transition-shadow/g, '');
cat = cat.replace(/\s*hover:shadow-lg/g, '');
cat = cat.replace(/\s*hover:shadow-md/g, '');
cat = cat.replace(/\s*hover:shadow-xl/g, '');
cat = cat.replace(/\s*shadow-sm\s*border\s*border-gray-100/g, '');
cat = cat.replace(/\s*shadow-sm/g, '');
cat = cat.replace(/\s*shadow-lg/g, '');

fs.writeFileSync('src/pages/CatalogPage.jsx', cat);

// ReaderDashboard
let rd = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');
rd = rd.replace(/transition-shadow/g, '');
rd = rd.replace(/hover:shadow-lg/g, '');
rd = rd.replace(/hover:shadow-xl/g, '');
fs.writeFileSync('src/pages/ReaderDashboard.jsx', rd);

console.log("Done");
