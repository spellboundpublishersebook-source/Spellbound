const fs = require('fs');
let content = fs.readFileSync('src/pages/TrialPage.jsx', 'utf8');

// 1. Feature pills
// Current: background: "#111111", border: "1px solid #E5E7EB",
// Current: color: "#374151"
content = content.replace(
  /background: "#111111", border: "1px solid #E5E7EB",\s+borderRadius: "100px"/g,
  'background: "#FFFFFF", border: "1px solid #E5E7EB",\n                  borderRadius: "100px"'
);

// 2. Form Card
// Current: background: "#111111", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "40px",
content = content.replace(
  /background: "#111111",\s+border: "1px solid #E5E7EB",\s+borderRadius: "16px",\s+padding: "40px"/g,
  'background: "#FFFFFF",\n              border: "1px solid #E5E7EB",\n              borderRadius: "16px",\n              padding: "40px"'
);

// 3. Inputs
// Current: width: "100%", background: "#111111", border: "1px solid #D1D5DB",
content = content.replace(
  /width: "100%", background: "#111111", border: "1px solid #D1D5DB"/g,
  'width: "100%", background: "#FFFFFF", border: "1px solid #D1D5DB"'
);

// Note: Ensure the "Sparkles" icon container remains black if it was changed
// Let's check where "#111111" is used.
// The button uses `background: loading ? "#4B5563" : "#111111"`, which is fine, it's black button with white text.

fs.writeFileSync('src/pages/TrialPage.jsx', content);
console.log('Fixed TrialPage themes');
