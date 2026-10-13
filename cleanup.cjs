const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// Remove states
content = content.replace(/const \[query, setQuery\] = useState\(""\);\n/, '');
content = content.replace(/const \[authorFilter, setAuthorFilter\] = useState\("All"\);\n/, '');
content = content.replace(/const \[pubTypeFilter, setPubTypeFilter\] = useState\("All"\);\n/, '');

// Clean up useMemo dependency array
content = content.replace(
  /\[myBooksRaw, query, selectedGenres, authorFilter, pubTypeFilter\]/g,
  '[myBooksRaw, selectedGenres]'
);

// Simplify matches logic
content = content.replace(
  /const q = query.*?;\n\s*const matchesQ = .*?;\n/s,
  ''
);
content = content.replace(
  /const matchesA = .*?;\n/s,
  ''
);
content = content.replace(
  /const matchesP = .*?;\n/s,
  ''
);
content = content.replace(
  /return matchesQ && matchesG && matchesA && matchesP;/s,
  'return matchesG;'
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Cleaned up');
