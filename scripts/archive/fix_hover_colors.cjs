const fs = require('fs');

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// Fix the active color from that brownish-red (#B45309) to black (#111111) 
content = content.replace(/color: isActive \? "#B45309" : "#4B5563"/g, 'color: isActive ? "#111111" : "#6B7280"');

// Fix Home / Free Trial hovers
content = content.replace(/e\.target\.style\.color = "#fff"/g, 'e.target.style.color = "#111111"');
content = content.replace(/e\.target\.style\.color = "#D1D5DB"/g, 'e.target.style.color = "#6B7280"');

// Fix Dashboard hover
content = content.replace(/includes\(view\) \? "#FDD132" : "#D1D5DB"/g, 'includes(view) ? "#111111" : "#6B7280"');

// Fix Logout button
// Current: style={{ color: "#6B7280", border: "1px solid #374151", ... }}
content = content.replace(/border: "1px solid #374151"/g, 'border: "1px solid #E5E7EB"');
// Current: onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#9CA3AF"; }}
content = content.replace(/e\.currentTarget\.style\.color = "#fff"; e\.currentTarget\.style\.borderColor = "#9CA3AF";/g, 'e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#F87171";');
// Current: onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.borderColor = "#374151"; }}
content = content.replace(/e\.currentTarget\.style\.color = "#9CA3AF"; e\.currentTarget\.style\.borderColor = "#374151";/g, 'e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "#E5E7EB";');

// In DrawerItem, fix the active color
content = content.replace(/color: danger \? "#DC2626" : active \? "#B45309" : "#4B5563"/g, 'color: danger ? "#DC2626" : active ? "#111111" : "#6B7280"');


fs.writeFileSync('src/components/Header.jsx', content);
console.log('Fixed hover colors');
