const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

content = content.replace(
  /return books\.slice\(3, 7\);/g,
  `return [...books].sort(() => 0.5 - Math.random()).slice(0, 4);`
);

content = content.replace(
  /return books\.slice\(7, 9\);/g,
  `return [...books].sort(() => 0.5 - Math.random()).slice(0, 4);`
);

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
