const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

const forceLogic = `      if (!parsed["faqs"]?.content || parsed["faqs"].content.length < 150) {
        parsed["faqs"] = DEFAULT_PAGES["faqs"];
      }
      parsed["contact-us"] = DEFAULT_PAGES["contact-us"];`;

content = content.replace(
  /      if \(\!parsed\["faqs"\]\?\.content \|\| parsed\["faqs"\]\.content\.length < 150\) \{\n        parsed\["faqs"\] = DEFAULT_PAGES\["faqs"\];\n      \}\n      if \(parsed\["contact-us"\]\?\.content\?\.includes\("support@spellbound\.example\.com"\)\) \{\n        parsed\["contact-us"\] = DEFAULT_PAGES\["contact-us"\];\n      \}/g,
  forceLogic
);

fs.writeFileSync('src/theme.js', content);
console.log('Fixed theme force');
