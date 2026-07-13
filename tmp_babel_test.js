const path = require('path');
try {
  const parser = require(path.resolve('frontend/node_modules/react-scripts/node_modules/@babel/parser'));
  console.log('parser loaded', typeof parser.parse === 'function');
} catch (e) {
  console.error('failed to load parser:', e.message);
  process.exit(1);
}
