const fs = require('fs');

function fixDuplicates(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // This regex finds elements with two className attributes on the same line.
  // Example: <p className="text-sm" className="text-gray-500">
  // We use a replacer function to merge them.
  content = content.replace(/className="([^"]+)"\s+className="([^"]+)"/g, (match, p1, p2) => {
    return `className="${p1} ${p2}"`;
  });

  // Sometimes there might be a space before the first className
  content = content.replace(/\s+className="([^"]+)"\s+className="([^"]+)"/g, (match, p1, p2) => {
    return ` className="${p1} ${p2}"`;
  });

  fs.writeFileSync(filePath, content);
}

fixDuplicates('src/pages/AdminPanel.jsx');
fixDuplicates('src/pages/UploaderPanel.jsx');
fixDuplicates('src/pages/CatalogPage.jsx');
fixDuplicates('src/pages/ReaderDashboard.jsx');
fixDuplicates('src/components/Header.jsx');

console.log('Fixed all duplicates');
