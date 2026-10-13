const fs = require('fs');

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

content = content.replace(
  /color: "#FFFFFF", fontWeight: "900", fontSize: "17px",\s+letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: "1", \.\.\.fontDisplay,/s,
  'color: "#FFFFFF", fontWeight: "900", fontSize: "17px",\n                letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: "1", ...fontBody,'
);

content = content.replace(
  /color: "#9CA3AF", fontWeight: "700", fontSize: "9px",\s+letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "5px", lineHeight: "1",/s,
  'color: "#9CA3AF", fontWeight: "400", fontSize: "10px", fontStyle: "italic",\n                letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", ...fontDisplay,'
);

content = content.replace(
  /color: "#FFFFFF", fontWeight: "900", fontSize: "15px",\s+letterSpacing: "0.12em", textTransform: "uppercase", \.\.\.fontDisplay,/s,
  'color: "#FFFFFF", fontWeight: "900", fontSize: "15px",\n              letterSpacing: "0.12em", textTransform: "uppercase", ...fontBody,'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Patched header');
