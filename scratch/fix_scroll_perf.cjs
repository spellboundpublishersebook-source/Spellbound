const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// 1. Add will-change:transform to all book cover cards so they're pre-composited
// Fix the trending carousel: remove hover:scale-125 and hover:z-30 on center card (causes layout recalc)
content = content.replace(
  `? 'scale-110 z-20 shadow-2xl hover:scale-125 hover:z-30' \r\n                        : 'scale-95 opacity-70 z-10 hover:scale-110 hover:opacity-100 hover:z-30'`,
  `? 'scale-110 z-20 shadow-2xl' \r\n                        : 'scale-95 opacity-70 z-10'`
);

content = content.replace(
  `? 'scale-110 z-20 shadow-2xl hover:scale-125 hover:z-30' \n                        : 'scale-95 opacity-70 z-10 hover:scale-110 hover:opacity-100 hover:z-30'`,
  `? 'scale-110 z-20 shadow-2xl' \n                        : 'scale-95 opacity-70 z-10'`
);

// 2. Fix group-hover scale on author avatars — replace with opacity change only (no layout calc)
content = content.replace(
  /group-hover:shadow-md group-hover:scale-105 transition-all/g,
  'group-hover:shadow-md transition-shadow'
);

// 3. Replace hover:shadow-xl (causes repaint) with hover:shadow-lg (lighter)
content = content.replace(/hover:shadow-xl/g, 'hover:shadow-lg');

// 4. Replace transition-all with transition-shadow or transition-colors (narrower = faster)
content = content.replace(/transition-all duration-200/g, 'transition-[opacity,box-shadow] duration-150');

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log("Done");
