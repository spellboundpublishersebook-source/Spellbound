const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

content = content.replace(
  /className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap"[\s\S]*?style=\{\{[\s\S]*?\}\}/g,
  `className={\`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px whitespace-nowrap transition-colors \${tab === t.id ? 'text-[#111111] border-[#FDD132]' : 'text-gray-400 border-transparent hover:text-gray-700 hover:border-gray-300'}\`}`
);

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
