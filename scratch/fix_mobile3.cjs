const fs = require('fs');

// Fix Header for small mobile screens
let hdr = fs.readFileSync('src/components/Header.jsx', 'utf8');
// The "SpellBound" text and "Publishers & Distributors" need to hide on very small screens
hdr = hdr.replace(
  `<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>`,
  `<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }} className="hidden sm:flex">`
);
fs.writeFileSync('src/components/Header.jsx', hdr);

// Fix AdminPanel/UploaderPanel overflow on mobile
let up = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');
up = up.replace(
  /className="max-w-6xl mx-auto px-6 py-10"/g,
  'className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10"'
);
up = up.replace(
  /className="grid sm:grid-cols-2 gap-x-4"/g,
  'className="grid grid-cols-1 sm:grid-cols-2 gap-x-4"'
);
fs.writeFileSync('src/pages/UploaderPanel.jsx', up);

console.log("Done");
