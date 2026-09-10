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

// Rewrite the bare-specifier `require("@climateshield/agents")` in the
// compiled output to a relative path require instead.
//
// WHY: extensive empirical testing (bare specifier vs real symlink vs real
// physical copy vs minimal package.json vs cleared cache vs direct file path)
// isolated a reproducible bug where `tsx`'s custom require() resolution
// returns an EMPTY object for a bare scoped-package specifier
// ("@climateshield/agents"/"@climateshield/orchestration") specifically,
// while a plain Node `require()` of the exact same specifier — and a
// `require()` of either package by a concrete relative/absolute file path,
// under BOTH plain Node and tsx — resolves correctly every time. Since
// cline_backend's dev server runs under `tsx watch`, and this compiled file
// is loaded as part of that process, its own internal
// `require("@climateshield/agents")` call hits the same bug. A relative path
// works because `agents/` and `orchestration/` are always siblings under the
// same parent — either the repo root (`agents/`, `orchestration/`) or
// `node_modules/@climateshield/` once installed as dependencies — so
// `../../agents/dist-cjs/index.js` (relative to this file at
// `dist-cjs/orchestrator.js`) reaches the right place in both layouts.
const orchestratorPath = path.join(dir, 'orchestrator.js');
if (fs.existsSync(orchestratorPath)) {
  const before = fs.readFileSync(orchestratorPath, 'utf8');
  const after = before.replace(
    /require\("@climateshield\/agents"\)/g,
    'require("../../agents/dist-cjs/index.js")',
  );
  if (after !== before) {
    fs.writeFileSync(orchestratorPath, after);
    console.log(`[write-cjs-marker] patched bare-specifier require() in ${orchestratorPath}`);
  }
}
