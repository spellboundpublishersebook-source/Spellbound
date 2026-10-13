const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

const regex = /\{\s*myBooks\.length === 0 && \([\s\S]*?\)\s*\}/;
content = content.replace(regex, '');

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
