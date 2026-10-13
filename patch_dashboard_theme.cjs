const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

content = content.replace(/className="bg-\[#111111\] text-white/g, 'className="bg-white text-black border-b border-gray-200');
content = content.replace(/bg-gray-800 text-gray-300 border border-gray-700/g, 'bg-gray-100 text-gray-700 border border-gray-200');
content = content.replace(/text-gray-400/g, 'text-gray-500');
content = content.replace(/bg-\[#1a1a1a\] border border-gray-800/g, 'bg-gray-50 border border-gray-200');
content = content.replace(/text-white/g, 'text-black');

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Patched dashboard theme');
