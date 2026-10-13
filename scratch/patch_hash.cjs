const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /function parseHash\(\) \{\n\s*const raw = window\.location\.hash\.replace\(\/\^#\/, ""\) \|\| "catalog";\n\s*const \[v, bookId\] = raw\.split\(":"\);\n\s*return \{ v, bookId: bookId \|\| null \};\n\s*\}/g,
  \`function parseHash() {
    const raw = window.location.hash.replace(/^#/, "") || "catalog";
    if (raw.startsWith("page:")) return { v: raw, bookId: null };
    const [v, bookId] = raw.split(":");
    return { v, bookId: bookId || null };
  }\`
);

fs.writeFileSync('src/App.jsx', content);
