const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// Change allGenres to use the full 'books' catalog instead of 'myBooksRaw'
content = content.replace(
  'const allGenres = Array.from(new Set(myBooksRaw.map(b => b.genre).filter(Boolean))).sort();',
  'const allGenres = Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort();'
);

// Ensure genreCounts renders '0' instead of empty if the count is undefined
content = content.replace(
  '{genreCounts[g]}',
  '{genreCounts[g] || 0}'
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log("Updated counts and genres!");
