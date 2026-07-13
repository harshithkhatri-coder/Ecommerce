const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
for (let n = 40; n <= 50; n++) {
  const sub = lines.slice(0, n).join('\n');
  try {
    parser.parse(sub, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator']
    });
    console.log('ok', n);
  } catch (err) {
    console.log('fail', n, err.message, err.loc);
  }
}
