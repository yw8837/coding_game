import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {thirdPartyNoticesPlugin} from './scripts/notices.mjs';

const desktop = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(desktop, '..');

export default defineConfig({
  root: path.join(desktop, 'client'),
  base: '/',
  publicDir: false,
  plugins: [react(), thirdPartyNoticesPlugin({stylesheets: [path.join(project, 'app', 'globals.css')]})],
  resolve: {alias: {'@': project}},
  css: {postcss: project},
  build: {
    outDir: path.join(desktop, 'renderer'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'chrome140',
    assetsInlineLimit: 0,
  },
});
