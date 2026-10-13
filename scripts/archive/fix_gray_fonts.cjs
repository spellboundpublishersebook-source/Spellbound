const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace Tailwind text-gray classes with text-black
  content = content.replace(/text-gray-400/g, 'text-black');
  content = content.replace(/text-gray-500/g, 'text-black');
  content = content.replace(/text-gray-600/g, 'text-black');
  content = content.replace(/text-gray-700/g, 'text-black');
  content = content.replace(/text-gray-800/g, 'text-black');
  content = content.replace(/text-gray-900/g, 'text-black');
  
  // Replace inline styles that set gray text colors
  content = content.replace(/color:\s*['"]#6B7280['"]/gi, 'color: "#000000"'); // gray-500
  content = content.replace(/color:\s*['"]#4B5563['"]/gi, 'color: "#000000"'); // gray-600
  content = content.replace(/color:\s*['"]#374151['"]/gi, 'color: "#000000"'); // gray-700
  content = content.replace(/color:\s*['"]#9CA3AF['"]/gi, 'color: "#000000"'); // gray-400

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir('src/pages');
walkDir('src/components');
console.log('All gray fonts changed to black');
