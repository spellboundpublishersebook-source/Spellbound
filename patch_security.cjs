const fs = require('fs');
let content = fs.readFileSync('src/pages/SecureReader.jsx', 'utf8');

// Enhance the keydown listener to also handle keyup for PrintScreen, which is required on Windows
const enhancedSecurity = `
    const applyScreenshotRestrictionAPI = (e) => {
      const key = e.key ? e.key.toLowerCase() : "";
      const isPrintScreen = e.key === "PrintScreen" || key === "printscreen";
      const isMacScreenshot = e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key);
      
      const blockedCombo = 
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && key === "u") ||
        (e.ctrlKey && key === "p") ||
        (e.ctrlKey && key === "s") ||
        isPrintScreen ||
        isMacScreenshot;
      
      if (blockedCombo) {
        e.preventDefault();
        setWarning(true);
        setIsFocused(false); // Force black screen instantly
        setTimeout(() => setWarning(false), 2500);
        
        if (isPrintScreen || isMacScreenshot) {
          // Use the native Clipboard API for free to overwrite screenshots
          try {
            navigator.clipboard.writeText("Screenshots are disabled for copyrighted material. Content is securely protected.");
          } catch(err) {}
        }
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("keydown", applyScreenshotRestrictionAPI);
    document.addEventListener("keyup", applyScreenshotRestrictionAPI); // Crucial for Windows PrintScreen
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("keydown", applyScreenshotRestrictionAPI);
      document.removeEventListener("keyup", applyScreenshotRestrictionAPI);
`;

// Replace the old blockKeys logic
content = content.replace(
  /const blockKeys = \(e\) => \{[\s\S]*?document\.removeEventListener\("keydown", blockKeys\);/m,
  enhancedSecurity
);

fs.writeFileSync('src/pages/SecureReader.jsx', content);
console.log('Fixed Security');
