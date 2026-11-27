// Answers 301 for every address of the old domain, at Cloudflare's edge (the host ignores .htaccess
// rewrites). The routes are anyairdrop.com/* and www.anyairdrop.com/*; the more specific route
// anyairdrop.com/ws* still goes to the signaling worker until it is retired.
const TARGET = 'https://wiserwork.org/file-data-tools/online-file-transfer';

// Files search engines read to verify the site, passed through to the host unchanged.
const KEEP = new Set(['/robots.txt', '/BingSiteAuth.xml', '/686b8e4a60b269e1f4c8cb8a5ec90965.txt']);

export default {
  async fetch(request) {
    const { pathname, hostname } = new URL(request.url);
    if (hostname === 'anyairdrop.com' && (KEEP.has(pathname) || pathname.startsWith('/.well-known/'))) {
      return fetch(request);
    }
    return new Response(null, {
      status: 301,
      headers: { Location: TARGET, 'Cache-Control': 'public, max-age=3600' },
    });
  },
};
