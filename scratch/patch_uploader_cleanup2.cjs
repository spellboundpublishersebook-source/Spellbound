const fs = require('fs');
let content = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');

content = content.replace(
  /className="flex items-center gap-1\.5 text-xs font-semibold"[\s\n]*className="text-\[#D4A017\]"/g,
  'className="flex items-center gap-1.5 text-xs font-semibold text-[#D4A017] hover:text-[#b8860b] transition-colors"'
);
content = content.replace(
  /className="flex items-center gap-1\.5 text-xs"[\s\n]*className="text-red-500 hover:text-red-700 transition-colors"/g,
  'className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"'
);

fs.writeFileSync('src/pages/UploaderPanel.jsx', content);
