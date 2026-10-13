const fs = require('fs');

// Fix CatalogPage - trending carousel on mobile (books too large)
let cat = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Make trending carousel books smaller on mobile
cat = cat.replace(
  'className="w-32 h-48 md:w-44 md:h-64 rounded-md shadow-2xl"',
  'className="w-24 h-36 sm:w-32 sm:h-48 md:w-44 md:h-64 rounded-md shadow-2xl"'
);

// Make Created For You section cards scrollable on mobile instead of fixed width
cat = cat.replace(
  'className="bg-white text-black rounded-xl p-4 flex gap-4 w-72 flex-shrink-0 shadow-lg cursor-pointer hover:shadow-lg transition-shadow"',
  'className="bg-white text-black rounded-xl p-4 flex gap-4 w-60 sm:w-72 flex-shrink-0 shadow-lg cursor-pointer hover:shadow-lg transition-shadow"'
);

// Reduce px on CatalogPage sections for mobile
cat = cat.replace(/className="max-w-7xl mx-auto px-6 py-12"/g, 'className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12"');
cat = cat.replace(/className="max-w-7xl mx-auto px-6 py-16"/g, 'className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16"');
cat = cat.replace(/className="max-w-7xl mx-auto px-6 py-8"/g, 'className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"');

fs.writeFileSync('src/pages/CatalogPage.jsx', cat);
console.log("Done");
