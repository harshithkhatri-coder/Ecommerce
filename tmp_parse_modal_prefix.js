const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
const start = 2470;
for (let n = start; n <= 2540; n++) {
  const sub = lines.slice(0, n).join('\n');
  try {
    parser.parse(sub, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator']
    });
  } catch (err) {
    console.log('fail at', n, err.message, err.loc);
    break;
  }
}
