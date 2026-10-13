const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

content = content.replace(
  /if \(parsed\["terms"\]\?\.content === "By using this platform, you agree to our terms of service."\) \{/g,
  'if (!parsed["terms"]?.content || parsed["terms"].content.length < 150) {'
);

content = content.replace(
  /if \(parsed\["privacy-policy"\]\?\.content === "We respect your privacy and protect your data."\) \{/g,
  'if (!parsed["privacy-policy"]?.content || parsed["privacy-policy"].content.length < 150) {'
);

content = content.replace(
  /if \(parsed\["faqs"\]\?\.content === "Q: How do I request a trial\?\\nA: Click 'Request Trial' on the book page."\) \{/g,
  'if (!parsed["faqs"]?.content || parsed["faqs"].content.length < 150) {'
);

fs.writeFileSync('src/theme.js', content);
