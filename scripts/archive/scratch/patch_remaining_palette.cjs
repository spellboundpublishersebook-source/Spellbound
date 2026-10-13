const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Buttons
content = content.replace(/style=\{\{ color: palette\.brass \}\}/g, 'className="text-[#D4A017] hover:text-[#b8860b] transition-colors"');
content = content.replace(/style=\{\{ color: isOffline \? palette\.success : palette\.warn \}\}/g, 'className={isOffline ? "text-green-600 hover:text-green-800 transition-colors" : "text-yellow-600 hover:text-yellow-800 transition-colors"}');
content = content.replace(/style=\{\{ color: palette\.danger \}\}/g, 'className="text-red-600 hover:text-red-800 transition-colors"');
content = content.replace(/style=\{\{ color: palette\.success \}\}/g, 'className="text-green-600 hover:text-green-800 transition-colors"');

// Containers
content = content.replace(/style=\{\{ backgroundColor: palette\.forestTint, borderColor: palette\.brass \}\}/g, 'className="bg-[#FFF9E6] border-[#FDEB9E]"');
content = content.replace(/style=\{\{ borderColor: palette\.line, backgroundColor: "#fff" \}\}/g, 'className="border-gray-200 bg-white"');

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
