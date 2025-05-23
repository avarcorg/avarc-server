#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = ['node_modules', 'node', '.next', 'build', 'target', 'utils'];
const JS_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walk(filepath, filelist);
      }
    } else if (JS_EXTENSIONS.includes(path.extname(file))) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function findTUsages(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const usages = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Exclude import lines and comments
    if (/import .*\bt\b/.test(line) || line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
    // Find t( usage
    if (/\bt\s*\(/.test(line)) {
      usages.push({ line: i + 1, content: line.trim() });
    }
  }
  return usages;
}

const allFiles = walk(FRONTEND_ROOT);
const tUsages = [];

for (const file of allFiles) {
  const usages = findTUsages(file);
  if (usages.length > 0) {
    tUsages.push({ file: path.relative(FRONTEND_ROOT, file), usages });
  }
}

console.log(JSON.stringify({ tUsages }, null, 2));

if (tUsages.length > 0) {
  process.exit(1);
}
