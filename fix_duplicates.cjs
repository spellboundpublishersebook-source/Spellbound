const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Fix duplicate className="text-gray-500" on labels
content = content.replace(/className="block text-sm font-semibold mb-1\.5" className="text-gray-500"/g, 'className="block text-sm font-semibold mb-1.5 text-gray-500"');

// Fix duplicate className="text-gray-900" on h3
content = content.replace(/className="text-lg font-bold text-gray-900" className="text-gray-900"/g, 'className="text-lg font-bold text-gray-900"');

// While we are here, let's fix UploaderPanel.jsx if it has the same issues
let contentUploader = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');
contentUploader = contentUploader.replace(/className="block text-sm font-semibold mb-1\.5" className="text-gray-500"/g, 'className="block text-sm font-semibold mb-1.5 text-gray-500"');
contentUploader = contentUploader.replace(/className="text-lg font-bold text-gray-900" className="text-gray-900"/g, 'className="text-lg font-bold text-gray-900"');
// Wait, I might have also caused duplicate classNames when trying to fix heading colors.
contentUploader = contentUploader.replace(/className="text-2xl font-semibold" className="text-\[#111111\]"/g, 'className="text-2xl font-semibold text-[#111111]"');

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
fs.writeFileSync('src/pages/UploaderPanel.jsx', contentUploader);

console.log('Fixed duplicates');
