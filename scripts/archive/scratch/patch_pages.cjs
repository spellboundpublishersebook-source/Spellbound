const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

const termsContent = `Welcome to SpellBound (Publishers & Distributors). By accessing or using our digital library platform, you agree to be bound by these Terms of Service.

1. License and Access
Your institution or personal account has been granted a limited, non-exclusive, non-transferable license to access the digital catalog for the duration specified in your license agreement. You may not share your login credentials with unauthorized users.

2. Intellectual Property
All books, journals, covers, and written materials provided on this platform are protected by copyright laws. You may not reproduce, distribute, or create derivative works from the content without express written permission from the respective publishers.

3. Account Restrictions
We reserve the right to suspend or terminate accounts that exhibit suspicious activity, share credentials, or violate our copyright policies.

4. Changes to Terms
We may update these terms at any time. Continued use of the platform constitutes your agreement to the updated terms.

If you have any questions regarding these terms, please contact us.`;

const privacyContent = `At SpellBound (Publishers & Distributors), we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.

1. Information We Collect
We collect the information you provide when creating an account or requesting a trial, including your name, email address, and institutional affiliation.

2. How We Use Your Information
- To provide access to your licensed digital library.
- To notify you about expiring licenses or upcoming renewals.
- To improve our platform and user experience.

3. Data Protection
We implement industry-standard security measures to ensure your data is protected against unauthorized access, alteration, or disclosure. We do not sell your personal data to third parties.

4. Cookies
Our platform uses minimal cookies strictly necessary for maintaining your logged-in session and preferences.

5. Your Rights
You have the right to request access to the personal data we hold about you and request its deletion. Please contact our support team for any privacy-related requests.`;

const faqsContent = `Frequently Asked Questions

Q: How do I request a trial for my institution?
A: You can request a trial by clicking the "Request Trial" button on any book in the catalog. Fill out the form with your details, and our administrative team will review your request and issue a 14-day trial pass.

Q: How do I know when my access expires?
A: You can view your remaining access days directly in your Reader Dashboard. If your access is expiring soon, the dashboard will display a warning indicator.

Q: Can I read books offline?
A: Currently, books are securely streamed directly to your browser through our secure reader to protect publisher copyrights. An active internet connection is required.

Q: Why can't I take screenshots of the books?
A: To comply with our publisher agreements and protect intellectual property, our secure reader restricts screenshot capabilities and right-click saving. 

Q: Who do I contact for technical support?
A: Please use the "Contact Us" page or reach out to your institution's library administrator.`;

content = content.replace(
  /"terms": \{ title: "Terms", content: ".*?" \},/s,
  `"terms": { title: "Terms of Service", content: \`${termsContent}\` },`
);

content = content.replace(
  /"privacy-policy": \{ title: "Privacy Policy", content: ".*?" \},/s,
  `"privacy-policy": { title: "Privacy Policy", content: \`${privacyContent}\` },`
);

content = content.replace(
  /"faqs": \{ title: "FAQs", content: ".*?" \},/s,
  `"faqs": { title: "Frequently Asked Questions", content: \`${faqsContent}\` },`
);

fs.writeFileSync('src/theme.js', content);
