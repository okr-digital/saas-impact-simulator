import { defineConfig } from 'vite';

export default defineConfig({
base: './',              // ensure relative paths, e.g. in index.html
build: {
    outDir: 'dist',      // gets deployed to github pages
    assetsDir: 'assets', // static assets (images, js, css, etc.)
},
});
