import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {thirdPartyNoticesPlugin} from './scripts/notices.mjs';
import {clientChunks} from '../scripts/client-chunks.mjs';

const desktop = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(desktop, '..');

export default defineConfig({
  root: path.join(desktop, 'client'),
  base: '/',
  // Resolve rooted art URLs during CSS compilation. The desktop build script
  // copies only game-art, so web trailers and hosting files stay out of the app.
  publicDir: path.join(project, 'public'),
  plugins: [react(), thirdPartyNoticesPlugin({stylesheets: [path.join(project, 'app', 'globals.css')]})],
  // Actual next/image uses its built-in browser defaults. Every game art
  // component explicitly uses unoptimized, so local URLs need no server.
  // Replace only these framework constants; never expose a process shim.
  resolve: {alias: {'@': project, 'next/image': path.join(desktop, 'client', 'image.tsx')}},
  define: {
    'process.env.__NEXT_IMAGE_OPTS': 'undefined',
    'process.env.NEXT_DEPLOYMENT_ID': JSON.stringify(''),
    'process.env.NEXT_SUPPORTS_IMMUTABLE_ASSETS': 'false',
    'process.env.NEXT_RUNTIME': 'undefined',
  },
  css: {postcss: project},
  build: {
    copyPublicDir: false,
    rolldownOptions: clientChunks,
    outDir: path.join(desktop, 'renderer'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'chrome140',
    assetsInlineLimit: 0,
  },
});
