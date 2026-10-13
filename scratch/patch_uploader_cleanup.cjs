const fs = require('fs');
let content = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');

// Container
content = content.replace(
  /className="flex gap-4 rounded-md border p-4" className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow"/g,
  'className="flex gap-4 rounded-xl border border-gray-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow"'
);

// Tags
content = content.replace(
  /className="text-xs font-semibold" className="text-\[#D4A017\]"/g,
  'className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] mb-1"'
);
content = content.replace(
  /className="font-semibold leading-snug mt-1" className="text-\[#111111\]"/g,
  'className="font-bold text-sm leading-tight text-[#111111]"'
);
content = content.replace(
  /className="text-xs mt-1" className="text-gray-500"/g,
  'className="text-xs text-gray-500 mt-0.5"'
);

// Buttons
content = content.replace(
  /className="flex items-center gap-1\.5 text-xs font-semibold"[\s\n]*className="text-gray-600 hover:text-black transition-colors"/g,
  'className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors"'
);
content = content.replace(
  /className="flex items-center gap-1\.5 text-xs font-semibold"[\s\n]*className="text-[#D4A017]"/g,
  'className="flex items-center gap-1.5 text-xs font-semibold text-[#D4A017] hover:text-[#b8860b] transition-colors"'
);
content = content.replace(
  /className="flex items-center gap-1\.5 text-xs font-semibold"[\s\n]*className="text-red-500 hover:text-red-700 transition-colors"/g,
  'className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"'
);

fs.writeFileSync('src/pages/UploaderPanel.jsx', content);
