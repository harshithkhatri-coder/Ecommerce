const fs = require('fs');
const path = 'frontend/src/Admin.jsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const start = parseInt(process.argv[2], 10) || 1;
const end = parseInt(process.argv[3], 10) || lines.length;
for (let i = start - 1; i < Math.min(end, lines.length); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
