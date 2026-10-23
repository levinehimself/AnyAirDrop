# AnyAirDrop.com

Send files between any phone and computer over the local Wi-Fi, in the browser. Files travel device to device over WebRTC; a small Cloudflare Worker only introduces the devices.

- **Site:** Astro 7 (static), Svelte 5 for the transfer tool, Inter via Fontsource.
- **Design:** "Quiet Radar", specified in [design-system/anyairdrop/MASTER.md](design-system/anyairdrop/MASTER.md).
- **Signaling:** Cloudflare Worker + Durable Objects with WebSocket hibernation, in [signaling/](signaling/).

## Run it locally

Needs Node 22.22 or newer. Install once:

```bash
npm install
```

Then start two processes, each in its own terminal:

```bash
npm run signal
```

```bash
npm run dev
```

Open http://localhost:4321 in two tabs or two browsers. Each gets a random name and sees the other on the radar. The dev server proxies `/ws` to the worker on port 8787, so the page and its WebSocket share one origin, as they will in production.

### Test with a real phone

Run `npm run dev:lan` instead of `npm run dev` (keep `npm run signal` running). It serves the site over HTTPS with a self-signed certificate on your network address. Open the printed `https://192.168.x.x:4321` address on the phone and accept the certificate warning. Browsers only allow the storage and screen wake-lock APIs on HTTPS.

In development, every device on a private network address lands in the same room, so all your test devices see each other.

## Checks

```bash
npm run check
```

```bash
npm run build
```

```bash
npm run test:signal
```

`test:signal` needs `npm run signal` running. It checks that devices with the same pairing code see each other, other codes stay isolated, signals reach only their target, malformed codes are rejected, and leaving is announced. It also covers trusted-device rooms (private, isolated, malformed tokens rejected) and renaming. It also checks the relay-credential endpoint: well-formed ICE servers, no caching, port 53 filtered, cross-site browser requests refused. Running it twice within a minute can trip the rate limit; wait a minute.

## How a transfer works

1. Each tab opens a WebSocket to `/ws`. The worker groups devices by public IPv4 address or IPv6 /64 prefix (hashed, never stored raw), or by a six-digit pairing code (`/ws?pair=123456`).
2. Tapping a device and picking files opens a WebRTC connection between the two browsers using the "perfect negotiation" pattern over a pre-negotiated data channel.
3. The sender offers the file list; the receiver taps Accept. Files stream in chunks of up to 64 KB with backpressure. The receiver confirms when everything is saved.
4. Files of 32 MB and up stream into the browser's private file system (OPFS) when available, so large videos don't fill a phone's memory. Smaller files stay in memory.
5. The UI reads the selected ICE candidate pair to say whether the transfer is direct over the Wi-Fi, direct over the internet, or relayed.

### Device name, trusted devices and ZIP

- **Device name:** shown under the radar, editable, kept in `localStorage` (`anyairdrop:devicename`). A rename is a second `hello` on the open socket, so other radars update at once.
- **Trusted devices:** while two devices are connected, one proposes a random 64-hex token over the data channel and the other accepts. Both store it (`anyairdrop:trusted`) and join the private room `/ws?trust=<token>` whenever the site is open, so they find each other on any network or VPN. The token is a bearer secret: anyone holding it can join that room, which only lists devices and relays signals. Trust never skips the Accept prompt unless the person turns on "accept their files without asking" for that device. Removing a device sends a revoke message so the other side forgets it too (if it is offline, it keeps the entry until removed there).
- **Automatic trust:** after a completed transfer the sender proposes the same handshake with `auto: true`. The receiver agrees only if its "Add devices automatically after a transfer" setting is on (default) and it received files from that device in the last two minutes, so nobody can add themselves without delivering something the receiver accepted. Both screens show "… is now a trusted device. Undo".
- **ZIP:** when several files arrive, "Save as ZIP" packs them with `client-zip` (stored, not recompressed). Browsers with a save dialog stream it to disk; others build it in memory up to 1 GB.
- A browser cannot read the Wi-Fi network name (SSID), so the site never shows it.

## Relay (TURN)

Some networks (guest Wi-Fi, offices, some mobile carriers) block direct connections between devices. For those, the browsers fall back to Cloudflare Realtime TURN, which relays the still-encrypted data. ICE always prefers a direct path, so the relay carries traffic only when nothing else works, and the UI then says "Through an encrypted relay".

- The page fetches `/ws/ice/` on load. The worker uses its TURN key to mint short-lived credentials (4 hours, `TURN_TTL`), and the browser renews them before they expire, including on open connections.
- The long-term TURN key never reaches the browser. Each address can fetch credentials 30 times a minute (`ICE_LIMITER`), and browser requests from other sites are refused unless listed in `ALLOWED_ORIGINS`.
- Without a TURN key, or if Cloudflare's credential API fails, the worker serves STUN only, logs the error, and tells browsers to check again in 10 minutes. Everything else keeps working.

**Turn it on:** create a TURN key in the Cloudflare dashboard (Realtime > TURN), then:

```bash
npx wrangler secret put TURN_KEY_ID --config signaling/wrangler.jsonc
```

```bash
npx wrangler secret put TURN_KEY_API_TOKEN --config signaling/wrangler.jsonc
```

For local development, copy [signaling/.dev.vars.example](signaling/.dev.vars.example) to `signaling/.dev.vars` and fill it in.

**Test the relay path:** add `?relay=force` to the page URL on both devices (`http://localhost:4321/?relay=force`). That forbids direct paths, so a transfer only succeeds through the relay. Relay traffic is billed at $0.05/GB after the first 1,000 GB each month; watch usage in the dashboard.

Code map: [src/lib/transfer/](src/lib/transfer/) holds the engine (`hub.ts` is the entry point), [src/components/TransferTool.svelte](src/components/TransferTool.svelte) the radar UI, [src/pages/index.astro](src/pages/index.astro) the homepage.

## Deploy

The pages are static files on a cPanel host. The domain's DNS is on Cloudflare with the proxy (orange cloud) on, so Cloudflare sends `anyairdrop.com/ws*` and `www.anyairdrop.com/ws*` to the signaling worker (routes in [signaling/wrangler.jsonc](signaling/wrangler.jsonc)) and everything else to cPanel.

1. **Signaling worker:** `npx wrangler login` once, then `npm run deploy:signal`. Add the TURN secrets (see Relay) to enable the relay. Check https://anyairdrop.com/ws/ice/ returns JSON.
2. **Pages:** `npm run build`, then upload the **contents** of `dist/` to the `anyairdrop.com` folder in cPanel File Manager (zip them, upload, Extract). Build the zip with forward-slash paths: Windows PowerShell 5.1's `Compress-Archive` writes backslashes, which unpack as wrong file names on Linux hosts.
3. **Cloudflare settings:** SSL/TLS mode Full (strict), Always Use HTTPS on, and a redirect rule from `www` to the root domain.

Live checks against production: `node signaling/test/rooms.test.mjs wss://anyairdrop.com/ws` and `node signaling/test/ice.test.mjs https://anyairdrop.com/ws/ice/`.

On Windows PowerShell, if `npm` or `npx` fail with "running scripts is disabled", use `npm.cmd` and `npx.cmd`.

If the worker must live on another host, build the site with `PUBLIC_SIGNAL_URL=wss://your-worker-host/ws`.

## Not done yet

- **The relay is built but not switched on:** it needs a Cloudflare TURN key (see Relay). It was tested end to end against a local TURN server and a mock of Cloudflare's credential API, not yet against Cloudflare itself.
- **Pages linked in the header and footer don't exist yet** (guides, help, privacy, terms), so those links 404. Post 1 is drafted in [content/blog/](content/blog/) but no blog route renders it yet.
- **Real-device testing** is still needed, especially iPhone Safari and Samsung Internet. Automated tests cover the signaling worker only; transfers were verified between two Chromium tabs (3 files, 45 MB, SHA-256 matched; decline and cancel flows).
- **No social share image** (`og:image`) yet.
- Devices behind one carrier-grade NAT share a public address and may see each other. Transfers still need the receiver to tap Accept.

## Notes

- npm 11 skips the install scripts of `esbuild` and `workerd` unless approved (`npm install-scripts approve esbuild workerd`). Their platform binaries install anyway and everything here works without the scripts.
- This folder is inside OneDrive. `node_modules` holds thousands of files; consider excluding it from sync or moving the project out of OneDrive.

## License

MIT. See [LICENSE](LICENSE).
