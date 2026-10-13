const fs = require('fs');

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// SpellBound desktop size: 22px -> 36px
content = content.replace(
  /fontSize: "22px",\s+letterSpacing: "0\.12em"/g,
  'fontSize: "34px",\n                letterSpacing: "0.14em"'
);

// Publishers & Distributors size: 10px -> 14px
content = content.replace(
  /fontSize: "10px", fontStyle: "italic",\s+letterSpacing: "0\.05em"/g,
  'fontSize: "15px", fontStyle: "italic",\n                letterSpacing: "0.06em"'
);

// Mobile SpellBound size: 18px -> 24px
content = content.replace(
  /fontSize: "18px",\s+letterSpacing: "0\.1em"/g,
  'fontSize: "24px",\n              letterSpacing: "0.1em"'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Updated font sizes');
