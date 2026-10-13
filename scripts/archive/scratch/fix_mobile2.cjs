const fs = require('fs');

// Fix ReaderDashboard sidebar on mobile
let rd = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// Find the sidebar + books grid layout and make it collapse on mobile
rd = rd.replace(
  /className="flex flex-col lg:flex-row gap-8 mt-8"/g,
  'className="flex flex-col lg:flex-row gap-8 mt-8"'
);

// Fix hero text size on mobile
rd = rd.replace(
  /className="text-4xl md:text-5xl font-bold mb-3"/g,
  'className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"'
);

// Fix horizontal padding on mobile
rd = rd.replace(
  /className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-20"/g,
  'className="max-w-7xl mx-auto px-3 sm:px-6 -mt-12 relative z-20 pb-20"'
);
rd = rd.replace(
  /className="bg-\[#111111\] text-white pt-12 pb-24 px-6 relative"/g,
  'className="bg-[#111111] text-white pt-8 pb-24 px-4 sm:px-6 relative"'
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', rd);

// Fix CatalogPage hero padding on mobile
let cat = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Fix hero title size
cat = cat.replace(
  'className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight uppercase"',
  'className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight uppercase"'
);

// Make book grid 2 cols on mobile
cat = cat.replace(
  'className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"',
  'className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"'
);

// New releases grid: 1 col mobile, 2 tablet
cat = cat.replace(
  'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"'
);

fs.writeFileSync('src/pages/CatalogPage.jsx', cat);
console.log("Done");
