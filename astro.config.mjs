import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import basicSsl from '@vitejs/plugin-basic-ssl';

const lan = process.argv.includes('--host');

export default defineConfig({
  site: 'https://anyairdrop.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,
  integrations: [svelte(), sitemap()],
  vite: {
    plugins: lan ? [basicSsl()] : [],
    server: {
      proxy: {
        '/ws': { target: 'ws://127.0.0.1:8787', ws: true, changeOrigin: true },
      },
    },
  },
});
