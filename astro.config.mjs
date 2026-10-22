// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev:lan` passes --host so phones on your Wi-Fi can open the dev site.
// Browsers only allow storage and wake-lock APIs on HTTPS (or localhost), so LAN
// mode serves a self-signed certificate.
const lan = process.argv.includes('--host');

export default defineConfig({
  site: 'https://anyairdrop.com',
  output: 'static',
  trailingSlash: 'always',
  // The blog index stays out of the sitemap until the first post is published.
  integrations: [svelte(), sitemap({ filter: (page) => !page.endsWith('/blog/') })],
  vite: {
    plugins: lan ? [basicSsl()] : [],
    server: {
      // The signaling worker runs on :8787 (`npm run signal`). Proxying it keeps
      // the page and its WebSocket on one origin, in dev and in production.
      proxy: {
        '/ws': { target: 'ws://127.0.0.1:8787', ws: true, changeOrigin: true },
      },
    },
  },
});
