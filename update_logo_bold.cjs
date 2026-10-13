const fs = require('fs');
let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// SpellBound desktop size: 34px -> 56px, add stroke for extra boldness
content = content.replace(
  /fontSize: "34px",\s+letterSpacing: "0\.14em"/g,
  'fontSize: "56px",\n                letterSpacing: "0.14em", WebkitTextStroke: "1px #DC2626"'
);

// Publishers & Distributors size: 15px -> 26px, add a bit of boldness
content = content.replace(
  /fontWeight: "400", fontSize: "15px", fontStyle: "italic",\s+letterSpacing: "0\.06em"/g,
  'fontWeight: "600", fontSize: "24px", fontStyle: "italic",\n                letterSpacing: "0.06em"'
);

// Adjust mobile sizes too just in case
content = content.replace(
  /fontSize: "24px",\s+letterSpacing: "0\.1em"/g,
  'fontSize: "32px",\n              letterSpacing: "0.1em", WebkitTextStroke: "1px #DC2626"'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Made text huge and ultra-bold');
