const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

const newContactUs = `  "contact-us": { title: "Contact Us", content: "Reach out to us using the following details:\\n\\nAddress: 113, Vivekananda Rd, Manicktala, Azad Hind Bag, Kolkata, West Bengal 700006\\nPhone: 6289998227\\nEmail: spellboudpd@gmail.com\\nWebsite: www.spellboudpd.in" },`;

content = content.replace(
  /  "contact-us": \{ title: "Contact Us", content: "Reach out to us at support@spellbound\.example\.com" \},/g,
  newContactUs
);

// Also make sure it parses back correctly if already saved in local storage (we don't control the user's local storage directly here, but we can bust the cache if needed. I'll just change the default).
fs.writeFileSync('src/theme.js', content);
console.log('Fixed theme.js');
