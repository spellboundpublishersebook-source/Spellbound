const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Replace root styling
content = content.replace(
  '<div style={{ backgroundColor: palette.paper, minHeight: "calc(100vh - 64px)" }}>',
  '<div className="bg-[#f8f9fa] min-h-screen pb-20">'
);
content = content.replace(
  '<h1 className="text-2xl font-semibold mb-1" style={{ ...fontDisplay, color: palette.ink }}>Super Admin</h1>',
  '<h1 className="text-3xl font-extrabold mb-1 text-[#111111]" style={fontDisplay}>Super Admin</h1>'
);
content = content.replace(
  '<p className="text-sm mb-8" style={{ color: palette.inkSoft }}>Full control over institutions, uploaders, and trial approvals.</p>',
  '<p className="text-sm mb-8 text-gray-500 font-medium">Full control over institutions, uploaders, and trial approvals.</p>'
);

// Tab buttons
content = content.replace(
  '<div className="flex gap-2 mb-8 border-b overflow-x-auto" style={{ borderColor: palette.line }}>',
  '<div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto pb-px">'
);

// We need to replace styling in the tables. 
// A lot of inline styles like `backgroundColor: palette.cream`, `borderColor: palette.line`, `backgroundColor: palette.forestTint`.
content = content.replace(/style={{ borderColor: palette\.line }}/g, 'className="border-gray-200"');
content = content.replace(/style={{ borderColor: palette\.line, backgroundColor: palette\.cream }}/g, 'className="bg-white border-gray-100"');
content = content.replace(/style={{ backgroundColor: palette\.forestTint }}/g, 'className="bg-gray-50 border-b border-gray-200"');
content = content.replace(/style={{ color: palette\.forest }}/g, 'className="text-gray-500 uppercase tracking-wider text-xs"');
content = content.replace(/style={{ color: palette\.inkSoft }}/g, 'className="text-gray-500"');
content = content.replace(/style={{ color: palette\.ink }}/g, 'className="text-gray-900"');

// And replace generic <div className="rounded-md border overflow-hidden"> to be white bg and shadow
content = content.replace(
  /<div className="rounded-md border overflow-hidden"/g,
  '<div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"'
);

// Fix headers that were `<h3 className="text-lg font-semibold"` to look modern
content = content.replace(
  /<h3 className="text-lg font-semibold"/g,
  '<h3 className="text-lg font-bold text-gray-900"'
);

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
