# The site moved to wiserwork.org (26 Nov 2026)

The file-transfer tool now lives at https://wiserwork.org/file-data-tools/online-file-transfer.
This domain only redirects there.

## How the redirect works

- The Cloudflare Worker `old-site-redirect` ([redirect/](../redirect/), routes `anyairdrop.com/*` and
  `www.anyairdrop.com/*`) answers **301** for every address, without the query string, to the new page.
  Exceptions, passed through to the host: `robots.txt`, `BingSiteAuth.xml`, the IndexNow key file and `/.well-known/`
  (certificate checks). Deploy with `npx wrangler deploy --config redirect/wrangler.jsonc`.
- `public/.htaccess` has the same rule, but the host ignores it (checked 26 Nov 2026: pages still answered 200 after
  the upload), which is why the Worker exists.
- `http://` and `www.` are first sent to `https://anyairdrop.com/` by Cloudflare (Always Use HTTPS and the www rule),
  then the 301 above applies.
- Ads are off (`src/config.ts`): the build emits no ad script and no `ads.txt`.
- `robots.txt` allows everything and lists no sitemap, so crawlers can follow the redirects.
- The deploy workflow and the weekly health check expect the 301.

## Routes

A Worker route wins over the origin, and the more specific `anyairdrop.com/ws*` route keeps going to the signaling
worker (checked: `/ws/ice/` still answers JSON).

## Still to do

- Keep the old signaling worker and its `/ws*` route for 14 days after the redirect (until 10 Dec 2026), so tabs that are
  still open keep working. Then remove the route; the owner deletes the worker.
- Owner: remove anyairdrop.com from the AdSense Sites list; point own links (YouTube, LinkedIn, other sites) at the new page;
  decide whether to rename or archive this repository; keep the domain for at least 12 months.
