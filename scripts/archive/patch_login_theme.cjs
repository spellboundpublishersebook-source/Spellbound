const fs = require('fs');

// 1. LoginPage
let contentLogin = fs.readFileSync('src/pages/LoginPage.jsx', 'utf8');
contentLogin = contentLogin.replace(/backgroundColor: "#222429"/g, 'backgroundColor: "#F9FAFB"');
// Change modal shadow slightly since it's on a light background now
contentLogin = contentLogin.replace(/boxShadow: "0 24px 50px rgba\(0,0,0,0.4\)"/g, 'boxShadow: "0 24px 50px rgba(0,0,0,0.1)"');
fs.writeFileSync('src/pages/LoginPage.jsx', contentLogin);

// 2. TrialPage (Wait, is TrialPage using #222429?)
let contentTrial = fs.readFileSync('src/pages/TrialPage.jsx', 'utf8');
contentTrial = contentTrial.replace(/backgroundColor: "#222429"/g, 'backgroundColor: "#F9FAFB"');
contentTrial = contentTrial.replace(/bg-\[#222429\]/g, 'bg-[#F9FAFB]');
fs.writeFileSync('src/pages/TrialPage.jsx', contentTrial);

console.log('Patched login and trial');
