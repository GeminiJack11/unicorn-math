// Lists every file the game needs and stamps a content hash into sw.js, so installed copies
// download the update. Run before each publish: node tools/stamp-sw.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['index.html', 'manifest.webmanifest', 'css', 'js', 'fonts', 'icons'];

function walk(rel) {
  const full = path.join(root, rel);
  if (fs.statSync(full).isFile()) return [rel];
  return fs.readdirSync(full).sort().flatMap((name) => walk(path.posix.join(rel, name)));
}

const files = roots.flatMap(walk).filter((f) => !f.endsWith('.txt'));
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(root, f)));
const version = hash.digest('hex').slice(0, 12);

const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/^const VERSION = .*$/m, `const VERSION = '${version}';`);
sw = sw.replace(/^const FILES = .*$/m, `const FILES = ${JSON.stringify(['./', ...files.map((f) => `./${f}`)])};`);
fs.writeFileSync(swPath, sw);
console.log(`sw.js stamped: version ${version}, ${files.length + 1} files`);
