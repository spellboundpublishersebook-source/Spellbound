const fs = require('fs');
let cat = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Restore proper styling to book cards - add back visual appearance without transition-shadow
// Main grid cards
cat = cat.replace(
  /className="book-card flex flex-col p-3"/g,
  'className="book-card flex flex-col p-3 bg-white border border-gray-100 rounded-lg"'
);

// New releases cards  
cat = cat.replace(
  /className="book-card p-4 flex gap-4"/g,
  'className="book-card p-4 flex gap-4"'
);

// Created for you cards
cat = cat.replace(
  /className="book-card flex gap-4 w-60 sm:w-72 flex-shrink-0 p-4"/g,
  'className="book-card flex gap-4 w-60 sm:w-72 flex-shrink-0 p-4 text-black"'
);

fs.writeFileSync('src/pages/CatalogPage.jsx', cat);
console.log("Done");
