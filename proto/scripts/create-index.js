#!/usr/bin/env node

import {
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, '..', 'generated');

/**
 * Fix import paths in generated files to use .js extensions
 * Required for NodeNext module resolution
 */
function fixImports(dir) {
  if (!existsSync(dir)) {
    return;
  }

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (item.endsWith('.ts')) {
      let content = readFileSync(fullPath, 'utf-8');
      // Fix relative imports that don't have .js extension
      // Match: from './path' or from '../path' (without .js)
      const updated = content.replace(
        /from\s+['"](\.[^'"]+)(?<!\.js)['"]/g,
        (match, path) => {
          // Don't add .js if it already ends with .js
          if (path.endsWith('.js')) return match;
          return `from '${path}.js'`;
        }
      );
      if (updated !== content) {
        writeFileSync(fullPath, updated);
        console.log(`Fixed imports in ${item}`);
      }
    }
  }
}

function getExports(dir, prefix = '') {
  const exports = [];

  if (!existsSync(dir)) {
    console.log(`Directory ${dir} does not exist yet`);
    return exports;
  }

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      exports.push(...getExports(fullPath, `${prefix}${item}/`));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      const moduleName = item.replace('.ts', '');
      exports.push(`export * from './${prefix}${moduleName}.js';`);
    }
  }

  return exports;
}

// Fix imports first
console.log('Fixing import paths...');
fixImports(generatedDir);

// Then create index
const exports = getExports(generatedDir);
const indexContent = `// Auto-generated index file
${exports.join('\n')}
`;

writeFileSync(join(generatedDir, 'index.ts'), indexContent);
console.log('Created generated/index.ts');
