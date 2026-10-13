const fs = require('fs');

let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Hero section
content = content.replace(/className="bg-\[#111111\] text-white/g, 'className="bg-[#F9FAFB] text-black');
// Footer
content = content.replace(/<footer className="bg-\[#111111\] text-gray-300/g, '<footer className="bg-white border-t border-gray-200 text-gray-600');

// Input in footer
content = content.replace(/bg-gray-900 border border-gray-700 text-white/g, 'bg-gray-50 border border-gray-300 text-black');
content = content.replace(/border-gray-800/g, 'border-gray-200');

// Text colors in footer
content = content.replace(/text-white/g, 'text-black');
content = content.replace(/text-gray-400/g, 'text-gray-500');
content = content.replace(/text-gray-300/g, 'text-gray-600');

// "SPELLBOUND" text inside footer was text-gray-200, let's make it text-black
content = content.replace(/text-gray-200 uppercase/g, 'text-black uppercase');


fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log('Patched catalog theme');
