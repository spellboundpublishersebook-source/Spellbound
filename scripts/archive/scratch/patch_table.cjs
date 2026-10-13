const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Fix double classes
content = content.replace(/className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm" className="border-gray-200"/g, 'className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"');
content = content.replace(/className="text-left px-4 py-3 font-semibold" className="text-gray-500 uppercase tracking-wider text-xs"/g, 'className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[11px]"');
content = content.replace(/className="border-t" className="bg-white border-gray-100"/g, 'className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors"');
content = content.replace(/className="text-xs text-blue-600 underline"/g, 'className="text-xs font-semibold text-blue-600 hover:underline"');
content = content.replace(/className="text-xs text-red-600 underline"/g, 'className="text-xs font-semibold text-red-600 hover:underline"');
content = content.replace(/className="text-xs"/g, 'className="text-[11px] font-semibold uppercase tracking-wider"');

// Fix modal close button logic
content = content.replace(/<button type="button" onClick=\{\(\) => setShowForm\(false\)\} className="text-gray-500" style=\{\{ textDecoration: 'underline' \}\}>/g, '<button type="button" onClick={() => setShowForm(false)} className="text-gray-500 font-bold text-sm hover:text-black hover:underline">');

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
