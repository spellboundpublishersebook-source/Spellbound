const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// The layout currently starts at:
// <div className="flex flex-col lg:flex-row gap-8">
// Then has:
// {/* Left Sidebar Filters */}
// ...
// </div>
// {/* Right Content - Books Grid */}

// Let's replace the wrapper and remove the sidebar
content = content.replace(
  /<div className="flex flex-col lg:flex-row gap-8">[\s\S]*?{\/\* Right Content - Books Grid \*\/}/,
  `<div className="w-full">
              {/* Right Content - Books Grid */}`
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Sidebar removed');
