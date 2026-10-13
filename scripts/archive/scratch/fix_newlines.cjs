const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');
content = content.replace(/\\n/g, '\n');
fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
