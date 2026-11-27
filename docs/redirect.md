# The site moved to wiserwork.org (26 Nov 2026)

The file-transfer tool now lives at https://wiserwork.org/file-data-tools/online-file-transfer.
This domain only redirects there.

## How the redirect works

- `public/.htaccess` answers **301** for every address, without the query string, to the new page.
  Exceptions: `robots.txt`, `BingSiteAuth.xml`, the IndexNow key file and `/.well-known/` (certificate checks).
- `http://` and `www.` are first sent to `https://anyairdrop.com/` by Cloudflare (Always Use HTTPS and the www rule),
  then the 301 above applies.
- Ads are off (`src/config.ts`): the build emits no ad script and no `ads.txt`.
- `robots.txt` allows everything and lists no sitemap, so crawlers can follow the redirects.
- The deploy workflow and the weekly health check expect the 301.

## If the host ignores the rule

The host once ignored a `.htaccess` rule (see `adsense-readiness.md`, item A4). If the homepage stops answering 301,
deploy a small Cloudflare Worker on the routes `anyairdrop.com/*` and `www.anyairdrop.com/*` that returns the same 301.
A route wins over the origin, and the more specific `anyairdrop.com/ws*` route keeps going to the signaling worker.

## Still to do

- Keep the old signaling worker and its `/ws*` route for 14 days after the redirect (until 10 Dec 2026), so tabs that are
  still open keep working. Then remove the route; the owner deletes the worker.
- Owner: remove anyairdrop.com from the AdSense Sites list; point own links (YouTube, LinkedIn, other sites) at the new page;
  decide whether to rename or archive this repository; keep the domain for at least 12 months.
