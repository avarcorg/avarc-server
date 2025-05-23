#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(FRONTEND_ROOT, 'public', 'locales', 'en');
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

function extractSafeTranslateCalls(content) {
  // Matches: safeTranslate('key', 'namespace') or safeTranslate("key", "namespace")
  const regex = /safeTranslate\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push({ key: match[1], namespace: match[2] });
  }
  return matches;
}

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return {};
  }
}

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(flattenKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}

// Helper to check if a nested key exists in an object
function hasNestedKey(obj, dottedKey) {
  return dottedKey.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj) !== undefined;
}

// 1. Gather all safeTranslate calls
const allFiles = walk(FRONTEND_ROOT);
const usedKeys = {}; // { namespace: Set(keys) }
const keyToFile = {}; // { namespace.key: [file, ...] }

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const calls = extractSafeTranslateCalls(content);
  for (const { key, namespace } of calls) {
    if (!usedKeys[namespace]) usedKeys[namespace] = new Set();
    usedKeys[namespace].add(key);
    const k = `${namespace}.${key}`;
    if (!keyToFile[k]) keyToFile[k] = [];
    keyToFile[k].push(path.relative(FRONTEND_ROOT, file));
  }
}

// 2. Gather all defined keys in each en JSON file
const definedKeys = {}; // { namespace: Set(keys) }
const allNamespaces = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace(/\.json$/, ''));

for (const namespace of allNamespaces) {
  const jsonFile = path.join(LOCALES_DIR, `${namespace}.json`);
  const json = loadJson(jsonFile);
  definedKeys[namespace] = new Set(flattenKeys(json));
}

// 3. Find missing and unused keys
const missingKeys = [];
const unusedKeys = [];

for (const namespace in usedKeys) {
  // Load the raw JSON for nested key checking
  const jsonFile = path.join(LOCALES_DIR, `${namespace}.json`);
  const json = loadJson(jsonFile);
  for (const key of usedKeys[namespace]) {
    const exists = hasNestedKey(json, key);
    // Debug output:
    console.log(`[DEBUG] Checking key '${key}' in namespace '${namespace}': exists=${exists}`);
    if (!exists) {
      missingKeys.push({
        file: keyToFile[`${namespace}.${key}`],
        key,
        namespace
      });
    }
  }
}

for (const namespace in definedKeys) {
  for (const key of definedKeys[namespace]) {
    if (!usedKeys[namespace] || !usedKeys[namespace].has(key)) {
      unusedKeys.push({
        namespace,
        key
      });
    }
  }
}

const report = { missingKeys, unusedKeys };
console.log(JSON.stringify(report, null, 2));
