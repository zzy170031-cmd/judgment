const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const errors = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.md')) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const link = match[1];
        if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(link) || link.includes('<')) continue;
        const target = path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]));
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
          errors.push(path.relative(root, file) + ': unresolved local link ' + link);
        }
      }
    }
  }
}
walk(root);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log('Inline Markdown file targets resolved; fragments and reference-style links were not checked.');
