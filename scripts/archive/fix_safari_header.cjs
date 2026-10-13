const fs = require('fs');
let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

const target = `<span style={{
                color: "#000000", fontWeight: "600", fontSize: "24px", fontStyle: "italic", letterSpacing: "0.02em", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", width: "100%", textAlign: "justify", textAlignLast: "justify", ...fontDisplay,
              }}>
                Publishers &amp; Distributors
              </span>`;

const replacement = `<div style={{
                color: "#000000", fontWeight: "600", fontSize: "16px", fontStyle: "italic", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", width: "100%", display: "flex", justifyContent: "space-between", ...fontDisplay
              }}>
                <span>PUBLISHERS</span>
                <span>&amp;</span>
                <span>DISTRIBUTORS</span>
              </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Header.jsx', content);
  console.log('Fixed Header explicitly');
} else {
  console.log('Target not found!');
}
