const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const lines = text.split(/\r?\n/);

function tryParse(upToLine) {
  const sub = lines.slice(0, upToLine).join('\n');
  try {
    parser.parse(sub, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator']
    });
    return null;
  } catch (err) {
    return { message: err.message, loc: err.loc };
  }
}

let low = 1;
let high = lines.length;
let failLine = null;
let failInfo = null;

while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  const result = tryParse(mid);
  if (result === null) {
    low = mid + 1;
  } else {
    failLine = mid;
    failInfo = result;
    high = mid - 1;
  }
}

console.log('first failing line', failLine, 'info', failInfo);
if (failLine) {
  const start = Math.max(1, failLine - 20);
  const end = Math.min(lines.length, failLine + 5);
  for (let i = start; i <= end; i++) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}
