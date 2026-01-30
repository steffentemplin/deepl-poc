import { build } from 'esbuild';
import { cpSync } from 'fs';

// Bundle TypeScript
await build({
  entryPoints: ['public/app.ts'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/public/app.js',
  minify: true,
  sourcemap: true,
  target: 'es2020',
});

// Copy static assets
cpSync('public/index.html', 'dist/public/index.html');
cpSync('public/styles.css', 'dist/public/styles.css');

console.log('Frontend build complete');
