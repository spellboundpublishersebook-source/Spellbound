const fs = require('fs');

// 1. Header.jsx
let header = fs.readFileSync('src/components/Header.jsx', 'utf8');
header = header.replace(
  /color: "#111111", fontWeight: "900", fontSize: "17px"/g,
  'color: "#DC2626", fontWeight: "900", fontSize: "22px"'
);
header = header.replace(
  /color: "#111111", fontWeight: "900", fontSize: "15px"/g,
  'color: "#DC2626", fontWeight: "900", fontSize: "18px"'
);
fs.writeFileSync('src/components/Header.jsx', header);


// 2. CatalogPage.jsx
let catalog = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');
catalog = catalog.replace(
  /<span className="font-black uppercase" style={fontBody}>SpellBound<\/span>/g,
  '<span className="font-black uppercase text-red-600" style={fontBody}>SpellBound</span>'
);
catalog = catalog.replace(
  /<span className="font-black text-black uppercase" style={fontBody}>SpellBound<\/span>/g,
  '<span className="font-black text-red-600 uppercase text-2xl tracking-[0.12em]" style={fontBody}>SpellBound</span>'
);
catalog = catalog.replace(
  /<strong className="uppercase" style={fontBody}>SpellBound<\/strong>/g,
  '<strong className="uppercase text-red-600" style={fontBody}>SpellBound</strong>'
);
fs.writeFileSync('src/pages/CatalogPage.jsx', catalog);


console.log('Patched fonts to red and bigger');
