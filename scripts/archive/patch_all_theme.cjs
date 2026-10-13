const fs = require('fs');

const files = [
  'src/components/Header.jsx',
  'src/pages/CatalogPage.jsx',
  'src/pages/AuthorsPage.jsx',
  'src/pages/ReaderDashboard.jsx',
  'src/pages/TrialPage.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace background colors for wrappers/sections
  content = content.replace(/background: "#111111"/g, 'background: "#FFFFFF"');
  // Wait, in TrialPage, background: "#111111" is used for the Sparkles icon container!
  if (file === 'src/pages/TrialPage.jsx') {
    // Keep the sparkles container as black because it needs contrast with the yellow icon
    content = content.replace(/background: "#FFFFFF"/g, 'background: "#111111"');
  }

  // Find remaining bg-[#111111]
  content = content.replace(/bg-\[#111111\]/g, 'bg-white');

  // Fix CatalogPage banner that I might have broken
  content = content.replace(/bg-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-black/g, 'bg-gray-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-black');

  // AuthorsPage header text
  if (file === 'src/pages/AuthorsPage.jsx') {
    content = content.replace(/text-white/g, 'text-black');
  }

  // ReaderDashboard curated section
  if (file === 'src/pages/ReaderDashboard.jsx') {
    content = content.replace(/bg-white rounded-2xl shadow-xl overflow-hidden mb-12 p-8 md:p-10 relative/g, 'bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-12 p-8 md:p-10 relative');
    // Inside curated, text was white
    content = content.replace(/text-white text-2xl/g, 'text-black text-2xl');
  }

  fs.writeFileSync(file, content);
});

console.log('Patched all remaining dark themes');
