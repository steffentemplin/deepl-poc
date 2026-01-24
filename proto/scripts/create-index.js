#!/usr/bin/env node

import { writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, '..', 'generated');

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

const exports = getExports(generatedDir);
const indexContent = `// Auto-generated index file
${exports.join('\n')}
`;

writeFileSync(join(generatedDir, 'index.ts'), indexContent);
console.log('Created generated/index.ts');
