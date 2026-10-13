const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// The file ends with:
//   );
// }
// </div>
//     </div>
//   );
// }

content = content.replace(/    <\/div>\n  \);\n\}\n<\/div>\n    <\/div>\n  \);\n\}/g, '    </div>\n  );\n}');

// Just to be safe, I'll do a more robust fix by finding the last closing of the component
let lines = content.split('\n');
let i = lines.length - 1;
while(lines[i].trim() === '}' || lines[i].trim() === ');' || lines[i].trim() === '</div>' || lines[i].trim() === '') {
    lines.pop();
    i--;
}
lines.push('    </div>');
lines.push('  );');
lines.push('}');
fs.writeFileSync('src/pages/ReaderDashboard.jsx', lines.join('\n'));
console.log('Fixed syntax');
