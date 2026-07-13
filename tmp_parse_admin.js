const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
try {
  parser.parse(text, {
    sourceType: 'module',
    plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator']
  });
  console.log('parsed ok');
} catch (err) {
  console.error(err.message);
  console.error(err.loc);
}
