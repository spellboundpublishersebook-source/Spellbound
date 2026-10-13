const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

const regex = /<div className="flex transition-transform duration-500 ease-out" style=\{\{ transform: \`translateX\(\-\$\{curatedIndex \* 100\}%\)\` \}\}>/g;
content = content.replace(regex, '<div className="flex w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${curatedIndex * 100}%)` }}>');

content = content.replace(
  /<p className="text-gray-400 text-sm mb-6">\{b\.author\}<\/p>/g,
  '<p className="text-gray-400 text-sm mb-6 line-clamp-2">{b.author}</p>'
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
