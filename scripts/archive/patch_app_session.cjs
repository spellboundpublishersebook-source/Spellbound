const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// For licenses
content = content.replace(
  /setSession\({\s*role: "reader", id, name: license\.name, type: "license",\s*bookIds: license\.bookIds, startDate: license\.startDate, endDate: license\.endDate,\s*}\);/,
  `setSession({
        role: "reader", id, name: license.name, type: "license",
        email: license.email || null, institution: license.institution || license.name,
        bookIds: license.bookIds, startDate: license.startDate, endDate: license.endDate,
      });`
);

// For readers
content = content.replace(
  /setSession\({\s*role: "reader", id, name: reader\.name, type: reader\.accountType \|\| "trial",\s*bookIds: reader\.bookIds\?\.length \? reader\.bookIds : "all", startDate: reader\.startDate, endDate: reader\.endDate,\s*}\);/,
  `setSession({
        role: "reader", id, name: reader.name, type: reader.accountType || "trial",
        email: reader.email || null, institution: reader.institution || null,
        bookIds: reader.bookIds?.length ? reader.bookIds : "all", startDate: reader.startDate, endDate: reader.endDate,
      });`
);

fs.writeFileSync('src/App.jsx', content);
console.log('Patched App.jsx session logic');
