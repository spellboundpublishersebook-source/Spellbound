const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

const targetStr = `<div className="flex w-full transition-transform duration-500 ease-out" style={{ transform: \`translateX(-\${curatedIndex * 100}%)\` }}>`;

// Check if it's already wrapped to avoid double wrapping
if (!content.includes('<div className="overflow-hidden">\\n                ' + targetStr)) {
  content = content.replace(targetStr, `<div className="overflow-hidden">\\n                  ${targetStr}`);
  
  // We need to add a closing </div> for the new wrapper.
  // The structure is:
  //                 <div className="flex w-full...
  //                   {curatedBooks.map...
  //                   )}
  //                 </div>
  //               </div> {/* End of bg-#111111 */}
  
  // So I'll find the closing div of the flex container and add an extra </div> after it.
  const endTarget = `                        </button>
                      </div>
                    </div>
                  ))}
                </div>`;
                
  content = content.replace(endTarget, endTarget + '\\n                </div>');
  
  fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
  console.log("Patched successfully");
} else {
  console.log("Already wrapped");
}
