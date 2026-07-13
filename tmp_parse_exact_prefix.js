const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
for (const n of [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]) {
  const sub = lines.slice(0, n).join('\n');
  try {
    parser.parse(sub, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator']
    });
    console.log('ok', n);
  } catch (err) {
    console.log('fail', n, err.message, err.loc);
    console.log('---- content end ----');
    console.log(sub.split(/\r?\n/).map((line, idx)=>`${idx+1}: ${line}`).slice(-5).join('\n'));
  }
}
