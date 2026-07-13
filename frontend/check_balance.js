const fs = require('fs');
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lt = (line.match(/</g)||[]).length;
  const gt = (line.match(/>/g)||[]).length;
  const open = (line.match(/{/g)||[]).length;
  const close = (line.match(/}/g)||[]).length;
  if (lt !== gt) console.log('angle mismatch', i+1, lt, gt, line.trim());
  if (open !== close) console.log('brace mismatch', i+1, open, close, line.trim());
}
