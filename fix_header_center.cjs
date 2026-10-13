const fs = require('fs');
let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// Change items-start to items-center
content = content.replace(
  /<div className="hidden sm:flex flex-col items-start">/g,
  '<div className="hidden sm:flex flex-col items-center">'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Fixed Header center');
