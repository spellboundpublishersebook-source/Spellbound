const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

// Inside getPages, force contact-us to default if it contains the old email
const fixLogic = `      if (!parsed["faqs"]?.content || parsed["faqs"].content.length < 150) {
        parsed["faqs"] = DEFAULT_PAGES["faqs"];
      }
      if (parsed["contact-us"]?.content?.includes("support@spellbound.example.com")) {
        parsed["contact-us"] = DEFAULT_PAGES["contact-us"];
      }`;

content = content.replace(
  /      if \(\!parsed\["faqs"\]\?\.content \|\| parsed\["faqs"\]\.content\.length < 150\) \{\n        parsed\["faqs"\] = DEFAULT_PAGES\["faqs"\];\n      \}/g,
  fixLogic
);

fs.writeFileSync('src/theme.js', content);
console.log('Fixed theme cache');
