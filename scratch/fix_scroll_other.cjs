const fs = require('fs');

// Fix ReaderDashboard too
let rd = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');
rd = rd.replace(/hover:shadow-xl/g, 'hover:shadow-lg');
rd = rd.replace(/transition-all/g, 'transition-[opacity,box-shadow]');
fs.writeFileSync('src/pages/ReaderDashboard.jsx', rd);

// Fix will-change on book cover divs in CatalogPage - add containment
let cat = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');
// Add will-change hint to BookCover wrappers that use transform
cat = cat.replace(
  /className={`cursor-pointer transform transition-\[opacity,box-shadow\] duration-150/g,
  'className={`cursor-pointer transform transition-[opacity,box-shadow] duration-150 [will-change:transform]'
);
fs.writeFileSync('src/pages/CatalogPage.jsx', cat);

console.log("Done");
