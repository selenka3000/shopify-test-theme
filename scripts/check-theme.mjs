import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const directories = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
const files = directories.flatMap(directory =>
  readdirSync(directory, { recursive: true })
    .map(file => path.join(directory, file))
    .filter(file => /\.(json|liquid|js|css)$/.test(file))
);
const read = file => readFileSync(file, 'utf8');
const withoutComments = text => text.replace(/{%-?\s*(comment|doc)\b[\s\S]*?{%-?\s*end\1\s*-?%}/g, '');
let jsonCount = 0;
let scriptCount = 0;
let referenceCount = 0;

for (const file of files) {
  const text = read(file);
  if (file.endsWith('.json')) {
    // Shopify's generated JSON files can start with a block comment.
    const data = JSON.parse(text.replace(/^\uFEFF/, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
    jsonCount++;
    const isSectionContainer = file.startsWith(`templates${path.sep}`) || file.startsWith(`sections${path.sep}`);
    for (const section of Object.values(isSectionContainer ? data.sections ?? {} : {})) {
      assert(existsSync(`sections/${section.type}.liquid`), `${file}: missing section ${section.type}`);
    }
    if (isSectionContainer && data.order) {
      assert.equal(new Set(data.order).size, data.order.length, `${file}: duplicate section order`);
      for (const id of data.order) assert(data.sections[id], `${file}: unknown section ID ${id}`);
    }
  }
  if (file.endsWith('.js')) {
    new Script(text, { filename: file });
    scriptCount++;
  }
  const code = withoutComments(text);
  for (const match of code.matchAll(/{%-?\s*(?:render|include)\s+['"]([^'"]+)['"]/g)) {
    assert(existsSync(`snippets/${match[1]}.liquid`), `${file}: missing snippet ${match[1]}`);
    referenceCount++;
  }
  for (const match of code.matchAll(/['"]([^'"\n]+)['"]\s*\|\s*asset_url\b/g)) {
    assert(existsSync(`assets/${match[1]}`), `${file}: missing asset ${match[1]}`);
    referenceCount++;
  }
}

assert.deepEqual(readdirSync('locales').sort(), [
  'de.json', 'de.schema.json', 'en.default.json', 'en.default.schema.json'
]);
assert(existsSync('layout/theme.liquid'));
console.log(`Validated ${jsonCount} JSON files, ${scriptCount} JavaScript files and ${referenceCount} static theme references; locales: DE/EN.`);
