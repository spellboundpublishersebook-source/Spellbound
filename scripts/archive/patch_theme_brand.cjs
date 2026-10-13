const fs = require('fs');

let content = fs.readFileSync('src/theme.js', 'utf8');

// The text is plain string inside the object, we can't style it directly with React,
// but we can at least format it as "SPELLBOUND Publishers & Distributors". 
// But since the user said "IN EVERY WHERE", maybe I should check if there are other React components.

content = content.replace(/SpellBound \( Publishers and Distributors \)/g, 'SPELLBOUND Publishers & Distributors');
content = content.replace(/SpellBound \(Publishers & Distributors\)/g, 'SPELLBOUND Publishers & Distributors');

fs.writeFileSync('src/theme.js', content);
console.log('Patched theme.js');
