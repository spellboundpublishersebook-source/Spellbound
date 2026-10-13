const fs = require('fs');
let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// Replace SPELLBOUND styling
content = content.replace(
  /color: "#DC2626", fontWeight: "900", fontSize: "56px",\s*letterSpacing: "0\.14em", WebkitTextStroke: "1px #DC2626", textTransform: "uppercase", lineHeight: "1", \.\.\.fontBody,/g,
  'color: "#DC2626", fontWeight: "900", fontSize: "56px", letterSpacing: "normal", WebkitTextStroke: "1px #DC2626", textTransform: "uppercase", lineHeight: "1", ...fontBody,'
);

// Replace Publishers & Distributors styling
content = content.replace(
  /color: "#000000", fontWeight: "600", fontSize: "24px", fontStyle: "italic",\s*letterSpacing: "0\.06em", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", \.\.\.fontDisplay,/g,
  'color: "#000000", fontWeight: "600", fontSize: "24px", fontStyle: "italic", letterSpacing: "0.02em", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", width: "100%", textAlign: "justify", textAlignLast: "justify", ...fontDisplay,'
);

// We need to make sure the container for both spans allows the second span to stretch to the first.
// The container is: <div className="hidden sm:flex flex-col items-start">
// Actually, `items-start` makes the flex children only as wide as their content. 
// We should change it to `items-stretch` or remove `items-start` so the second span can take 100% width of the first.
content = content.replace(
  /<div className="hidden sm:flex flex-col items-start">/g,
  '<div className="hidden sm:flex flex-col items-stretch">'
);

// We also need to fix the mobile version of SPELLBOUND
content = content.replace(
  /color: "#DC2626", fontWeight: "900", fontSize: "32px",\s*letterSpacing: "0\.1em", WebkitTextStroke: "0\.5px #DC2626", textTransform: "uppercase", lineHeight: "1", \.\.\.fontBody,/g,
  'color: "#DC2626", fontWeight: "900", fontSize: "32px", letterSpacing: "normal", WebkitTextStroke: "0.5px #DC2626", textTransform: "uppercase", lineHeight: "1", ...fontBody,'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Fixed Header');
