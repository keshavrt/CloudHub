const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.next' || file === 'dist' || file === '.git') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk('.');
let found = false;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('gemini-1.5-flash')) {
    console.log('Found in:', f);
    found = true;
  }
});

if (!found) {
  console.log('No leftover references to gemini-1.5-flash found!');
}
