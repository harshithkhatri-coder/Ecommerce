const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);
for (const end of [46, 60, 100, 200, 300]) {
  const sub = lines.slice(0, end).join('\n');
  try {
    parser.parse(sub, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'classProperties']
    });
    console.log('prefix ok up to', end);
  } catch (err) {
    console.log('prefix fail at', end, err.message, err.loc);
  }
}
