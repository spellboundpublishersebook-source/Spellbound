const fs = require('fs');
let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

const target = `<div style={{
                color: "#000000", fontWeight: "600", fontSize: "16px", fontStyle: "italic", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", width: "100%", display: "flex", justifyContent: "space-between", ...fontDisplay
              }}>
                <span>PUBLISHERS</span>
                <span>&amp;</span>
                <span>DISTRIBUTORS</span>
              </div>`;

const replacement = `<span style={{
                color: "#000000", fontWeight: "600", fontSize: "18px", fontStyle: "italic", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", letterSpacing: "normal", ...fontDisplay
              }}>
                Publishers &amp; Distributors
              </span>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  
  // also revert items-stretch to items-start just to be clean
  content = content.replace(
    /<div className="hidden sm:flex flex-col items-stretch">/g,
    '<div className="hidden sm:flex flex-col items-start">'
  );
  
  fs.writeFileSync('src/components/Header.jsx', content);
  console.log('Fixed Header explicitly');
} else {
  console.log('Target not found!');
}
