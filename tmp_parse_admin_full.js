const fs = require('fs');
const path = require('path');
const parser = require(path.resolve('frontend/node_modules/@babel/parser'));
const text = fs.readFileSync('frontend/src/Admin.jsx', 'utf8');
const options = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'optionalChaining',
    'nullishCoalescingOperator',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'importMeta',
    'topLevelAwait'
  ]
};
try {
  parser.parse(text, options);
  console.log('parsed ok');
} catch (err) {
  console.error(err.message);
  console.error(err.loc);
}
