const fs = require('fs');

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// NavLinks color
content = content.replace(
  /color: isActive \? "#FDD132" : "#D1D5DB"/g,
  'color: isActive ? "#B45309" : "#4B5563"'
);

// DrawerItem color
content = content.replace(
  /color: danger \? "#F87171" : active \? "#FDD132" : "#D1D5DB"/g,
  'color: danger ? "#DC2626" : active ? "#B45309" : "#4B5563"'
);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Patched Header text colors');
