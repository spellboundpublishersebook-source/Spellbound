const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /\/\/ Inactivity auto-logout\n\s*useEffect\(\(\) => \{\n\s*if \(\!session\) return;\n\s*let timeoutId;\n\s*const resetTimer = \(\) => \{\n\s*clearTimeout\(timeoutId\);\n\s*timeoutId = setTimeout\(\(\) => \{\n\s*setSession\(null\);\n\s*setView\("catalog"\);\n\s*setOpenBookId\(null\);\n\s*alert\("You have been automatically logged out due to 30 minutes of inactivity\."\);\n\s*\}, 30 \* 60 \* 1000\); \/\/ 30 minutes\n\s*\};\n\s*resetTimer\(\);\n\s*window\.addEventListener\("mousemove", resetTimer\);\n\s*window\.addEventListener\("keydown", resetTimer\);\n\s*window\.addEventListener\("scroll", resetTimer\);\n\s*window\.addEventListener\("click", resetTimer\);\n\s*return \(\) => \{\n\s*clearTimeout\(timeoutId\);\n\s*window\.removeEventListener\("mousemove", resetTimer\);\n\s*window\.removeEventListener\("keydown", resetTimer\);\n\s*window\.removeEventListener\("scroll", resetTimer\);\n\s*window\.removeEventListener\("click", resetTimer\);\n\s*\};\n\s*\}, \[session\]\);/s;

const newInactivity = `  // Inactivity auto-logout (Highly optimized)
  useEffect(() => {
    if (!session) return;
    
    let lastActivity = Date.now();
    let isThrottled = false;
    
    const updateActivity = () => {
      if (isThrottled) return;
      lastActivity = Date.now();
      isThrottled = true;
      setTimeout(() => { isThrottled = false; }, 2000); // Throttle events to max once per 2 seconds
    };

    // Use passive listeners so scrolling isn't blocked by the browser!
    const listenerOptions = { passive: true };
    
    window.addEventListener("mousemove", updateActivity, listenerOptions);
    window.addEventListener("keydown", updateActivity, listenerOptions);
    window.addEventListener("scroll", updateActivity, listenerOptions);
    window.addEventListener("click", updateActivity, listenerOptions);

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) {
        setSession(null);
        setView("catalog");
        setOpenBookId(null);
        alert("You have been automatically logged out due to 30 minutes of inactivity.");
      }
    }, 60 * 1000); // Check once per minute

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", updateActivity, listenerOptions);
      window.removeEventListener("keydown", updateActivity, listenerOptions);
      window.removeEventListener("scroll", updateActivity, listenerOptions);
      window.removeEventListener("click", updateActivity, listenerOptions);
    };
  }, [session]);`;

if (content.match(regex)) {
  content = content.replace(regex, newInactivity);
  fs.writeFileSync('src/App.jsx', content);
  console.log("Success");
} else {
  console.log("Failed to match");
}
