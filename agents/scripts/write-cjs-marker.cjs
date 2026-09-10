// Marks dist-cjs/ as CommonJS (overriding the package's own "type": "module")
// via Node's nested-package.json rule, so the compiled output there is always
// interpreted as CommonJS regardless of the parent package.json. Plain .cjs
// extension keeps this script itself unambiguous.
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'dist-cjs');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');
console.log(`[write-cjs-marker] wrote ${path.join(dir, 'package.json')}`);
