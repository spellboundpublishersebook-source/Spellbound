const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');

// Add state variables
content = content.replace(
  /const \[duration, setDuration\] = useState\(12\);/,
  `const [duration, setDuration] = useState(12);
  const [customId, setCustomId] = useState("");
  const [customPassword, setCustomPassword] = useState("");`
);

// Modify handleCreate
content = content.replace(
  /const id = genCredentialId\(name\.slice\(0, 3\)\.toUpperCase\(\) \|\| "COL"\);\n\s*const pass = genPassword\(\);/,
  `const id = customId.trim() || genCredentialId(name.slice(0, 3).toUpperCase() || "COL");
    const pass = customPassword.trim() || genPassword();`
);

// Clear state on success
content = content.replace(
  /setName\(""\); setEmail\(""\); setSeats\(100\); setPrice\(""\); setSelected\(\[\]\); setStartDate\(today\(\)\); setDuration\(12\); setIsTest\(false\);/,
  `setName(""); setEmail(""); setSeats(100); setPrice(""); setSelected([]); setStartDate(today()); setDuration(12); setIsTest(false); setCustomId(""); setCustomPassword("");`
);

// Add inputs to form
content = content.replace(
  /<Field label="Institution name" required value={name} onChange={\(e\) => setName\(e\.target\.value\)} \/>/,
  `<Field label="Institution name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Field label="Custom Login ID (optional)" placeholder="Leave blank to auto-generate" value={customId} onChange={(e) => setCustomId(e.target.value)} />
                <Field label="Custom Password (optional)" placeholder="Leave blank to auto-generate" value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} />`
);

fs.writeFileSync('src/pages/AdminPanel.jsx', content);
console.log('Patched AdminPanel.jsx to support custom ID and Password');
