const parser = require('path').resolve; const p = require('path').resolve('frontend/node_modules/@babel/parser'); const parserModule = require(p);
const code = 'export default function Admin({ onPageChange, onLogout }) {}';
try {
  parserModule.parse(code, { sourceType:'module', plugins:['jsx','optionalChaining','nullishCoalescingOperator'] });
  console.log('line parses');
} catch (err) {
  console.error('line fail', err.message);
}
