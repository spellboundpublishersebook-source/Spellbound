const fs = require('fs');
let content = fs.readFileSync('src/theme.js', 'utf8');

content = content.replace(
  /export function getPages\(\) \{[\s\S]*?return DEFAULT_PAGES;\n\}/g,
  `export function getPages() {
  const local = localStorage.getItem("athenaeum_pages");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed["terms"]?.content === "By using this platform, you agree to our terms of service.") {
        parsed["terms"] = DEFAULT_PAGES["terms"];
      }
      if (parsed["privacy-policy"]?.content === "We respect your privacy and protect your data.") {
        parsed["privacy-policy"] = DEFAULT_PAGES["privacy-policy"];
      }
      if (parsed["faqs"]?.content === "Q: How do I request a trial?\\nA: Click 'Request Trial' on the book page.") {
        parsed["faqs"] = DEFAULT_PAGES["faqs"];
      }
      return { ...DEFAULT_PAGES, ...parsed };
    } catch (e) {
      console.error("Failed to parse pages:", e);
    }
  }
  return DEFAULT_PAGES;
}`
);

fs.writeFileSync('src/theme.js', content);
