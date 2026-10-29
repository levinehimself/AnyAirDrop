# Code comments

This file holds every comment that used to live inside the source files. The files themselves no longer contain comments; the explanations are kept here instead.

- **Not deployed.** This file sits at the repository root, outside `public/`, so the build never copies it to `dist/` and it never reaches the live server.
- **Where each note was.** Every entry names the file, the line it was on, and the line of code it sat above (or, for a note at the end of a line, the line it was on). Line numbers refer to the files as they were in commit `c4ce25c`. To see the original in place, run `git show c4ce25c:<path>`.
- **Adding new notes.** Write them here, under the file's heading, instead of in the code. Keep the same shape: where it applies, then the note.

## Pages and layouts

### `src/components/PostList.astro`

- **Line 7, above `eager?: number;`:** The first images load at once; lower ones wait until they scroll into view.
- **Line 20, above `<Image src={post.data.heroImage} alt="" widths={[360, 720]} sizes="(min-width: 1000px) 330px, (min-width: 640p`:** The title below names the post, so the picture adds no extra words for screen readers.
- **Line 32, above `.posts {`:** The page layout styles every list inside its text column, so these win with !important.

### `src/layouts/Base.astro`

- **Line 11, above `noindex?: boolean;`:** Keep a page out of search results, e.g. while it has no real content yet.
- **Line 13, above `ogType?: 'website' | 'article';`:** "article" for blog posts.
- **Line 15, above `ogImage?: string;`:** Absolute URL of the share image.
- **Line 19, above `ads?: boolean;`:** Load the ad script. Only guide pages do: never the homepage or anything that embeds the transfer tool.
- **Lines 41-42, above `<script is:inline>`:** Sets the theme before the first paint, so there is no flash. A saved choice wins, then the device's preference, and light if neither can be read.
- **Line 65, on `{}`:** Proves ownership to AdSense on every page without loading any ads.
- **Line 125, above `if (window.matchMedia) {`:** Until the visitor picks a theme, follow the device when it changes.
- **Lines 144-146, above `.site-header,`:** The header and footer span the window, so the logo and menu sit near the corners and the content stays centered between them. A cap keeps them from drifting apart on ultrawide screens.
- **Line 190, above `.wordmark {`:** Unbounded is very wide, so it is set smaller than the body text would be.

### `src/layouts/BlogPost.astro`

- **Line 133, above `<div class="ad-pool" hidden>`:** The top and middle slots start here and are moved into the article by the script below.
- **Line 147, above `if (top && headings.length > 0) headings[0].before(top);`:** After the introduction: before the first section heading.
- **Line 149, above `if (middle && headings.length >= 4) headings[Math.floor(headings.length / 2)].before(middle);`:** At the midpoint, and only when the guide is long enough for it not to crowd the first one.
- **Line 326, above `.post-body {`:** The post's own markdown is rendered inside this wrapper, so its elements are styled globally.
- **Line 405, above `.post-body :global(table) {`:** Tables scroll sideways inside the column instead of stretching the page on phones.
- **Line 431, above `.post-body :global(p:has(> img)) {`:** A figure inside the article: a markdown image with an italic caption line under it.
- **Lines 561-562, above `.hero {`:** The diagrams are drawn 800 units wide with small labels, so on a phone they scroll sideways at a size that stays readable instead of shrinking to fit.

### `src/layouts/Page.astro`

- **Line 9, above `updated?: string;`:** For policy pages: shown as "Last updated …" under the introduction.
- **Line 11, above `extraJsonLd?: Record<string, unknown>[];`:** Extra structured-data nodes (for example the person behind the site).
- **Line 15, above `wide?: boolean;`:** A wider column, for pages that show a grid of cards. The heading and intro stay narrow.
- **Line 61, above `.prose.wide > h1,`:** On a wide page the introduction keeps a comfortable reading width.

### `src/pages/[file].txt.ts`

- **Lines 4-5, above `export const getStaticPaths = (() => (ADS_ENABLED ? [{ params: { file: 'ads' } }] : [])) satisfies GetStaticPa`:** Serves /ads.txt with the exact line AdSense expects, and only once ads are switched on. While they are off, no file is produced at all.

### `src/pages/about.astro`

- **Line 180, on `padding: 0 !important;`:** the page's list style would indent the tags

### `src/pages/contact.astro`

- **Line 98, on `padding: 0 !important;`:** the page's list style would indent the cards

### `src/pages/index.astro`

- **Line 51, above `@media (min-width: 721px) and (min-height: 640px) {`:** Desktop: the whole homepage fits in the window, with no page scrolling.
- **Lines 58-59, above `body > main {`:** Content never overflows at normal sizes; if a tiny window ever makes it, it can still scroll, but without drawing a scrollbar.
- **Line 103, above `@media (min-width: 721px) and (max-height: 780px) {`:** Short desktop windows: a smaller headline keeps the tool in view.

## Transfer tool (browser)

### `src/components/AdSlot.astro`

- **Line 22, above `.ad-slot {`:** Clearly unlike the article: tinted, boxed and labelled, so it never reads as part of the guide.

### `src/components/TestedBox.astro`

- **Line 41, above `.tested-title {`:** Not an h2 in the table of contents: the heading is part of the box, not a section of the guide.

### `src/components/TransferTool.svelte`

- **Line 39, above `const SLOT_ANGLES = [215, 335, 95, 275, 155, 35, 245, 65];`:** Where devices sit on the radar: angles (degrees, clockwise from 3 o'clock).
- **Line 57, above `let trusted = $state<TrustedDevice[]>([]);`:** Trusted devices: kept on this device, and found again through a secret room.
- **Lines 65-66, above `let autoTrust = $state(true);`:** After a completed transfer both devices remember each other as trusted (can be turned off). The receiver only agrees to a device it has just received files from.
- **Lines 76-77, above `let debugNet = $state('');`:** ?debug=1 shows which shared-network group this device lands in. Two devices find each other automatically only when their groups match.
- **Line 92, above `const qr = $derived(myCode ? makeQr('${location.origin}/?pair=${myCode}') : null);`:** Scanning this opens AnyAirDrop.com/?pair=… on the other device, which joins our room.
- **Lines 118-119, above `let speed = $state(0);`:** Live speed while a transfer runs, and the route and average speed once it is done, so a slow transfer can be explained (for example, a VPN pushing it through the relay).
- **Line 125, above `const slowRoute = $derived(`:** A transfer that is not going straight across the Wi-Fi and is crawling: say why.
- **Line 157, above `const params = new URL(location.href).searchParams;`:** ?relay=force sends everything through the relay: a QA aid for testing that path.
- **Lines 196-198, above `myCode = loadCode();`:** Join our own pairing room right away, so the code on screen works from the first second. It keeps two devices connected even when a VPN gives them different public addresses, because it does not depend on the network address at all.
- **Line 201, above `const code = params.get('pair');`:** A shared link like AnyAirDrop.com/?pair=123456 joins that pairing room directly.
- **Line 215, above `}`:** Storage unavailable: use a fresh code.
- **Line 223, above `}`:** Not persisted; fine.
- **Line 245, above `const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.size > 0 || f.type !== '');`:** Dropped folders arrive as empty, typeless entries; skip them.
- **Line 309, above `let latest: [number, number] | null = null;`:** Chunks arrive hundreds of times a second; repaint the bar about ten times a second.
- **Line 336, above `async function finishStats(link: PeerLink, bytes: number): Promise<void> {`:** Called when a transfer completes: reads the route that was really used.
- **Line 344, above `}`:** Keep what was read earlier.
- **Line 372, above `const token = hub?.trustTokenOf(transfer.peer.id);`:** A trusted device the person chose to auto-accept skips the question.
- **Line 408, above `function dismiss(): void {`:** Tapping outside the phone sheet closes it only when nothing is in progress.
- **Lines 413-414, above `async function readRoute(link: PeerLink): Promise<void> {`:** Read the route shortly after the transfer starts, and again a few seconds in, because the browser can settle on a different path once the connection is busy.
- **Line 479, above `function syncTrusted(): void {`:** Marks which trusted devices are online and keeps their saved names current.
- **Line 555, above `async function autoTrustPeer(peer: RemotePeer): Promise<void> {`:** Sender side, right after a completed transfer: quietly propose to remember each other.
- **Line 568, above `}`:** The other device went away; nothing to remember.
- **Lines 588-589, above `const justReceived =`:** Only accepted from a device we have just received files from, so nobody can add themselves without delivering something this person accepted.
- **Line 867, above `@media (min-width: 721px) and (min-height: 640px) {`:** Desktop: size the radar to the window so the whole page fits without scrolling.
- **Lines 870-871, above `width: min(86vw, clamp(200px, calc(100dvh - 530px), 440px));`:** Sized for the tallest state, with a device connected (it adds a line above the pairing area), so the QR code never touches the footer.
- **Lines 1225-1226, above `.qr-frame {`:** Dark modules on a white tile in both themes, so any camera reads it. The solid frame gives it strong contrast against the page: near-black on the light theme.
- **Line 1247, above `.mycode-text {`:** The label, the code and the hint share one centered column.
- **Line 1323, above `@media (max-width: 720px) {`:** Phones: anything beyond the idle hint rises as a bottom sheet.

### `src/lib/qr.ts`

- **Line 4, above `path: string;`:** SVG path of the dark modules, one unit per module.
- **Line 6, above `viewBox: string;`:** SVG viewBox that includes a blank margin (the "quiet zone") around the code.
- **Line 12, above `export function makeQr(text: string): QrImage {`:** Builds a QR code for `text` as SVG data, so nothing is drawn from a remote image.

### `src/lib/transfer/emitter.ts`

- **Line 3, above `export class Emitter<Events extends Record<string, unknown[]>> {`:** Minimal typed event emitter shared by the transfer engine classes.

### `src/lib/transfer/hub.ts`

- **Line 18, above `trustoffer: [peer: RemotePeer, xid: string, token: string, auto: boolean];`:** Another device asks to be trusted: answer with answerTrust().
- **Line 21, above `trustrevoked: [token: string];`:** A trusted device removed this device from its list.
- **Lines 33-36, above `export class Hub extends Emitter<HubEvents> {`:** The transfer engine's front door: joins signaling rooms, tracks nearby devices, opens WebRTC links on demand and routes transfer messages to the right transfer.
- **Line 57, above `this.ice.on('updated', (servers) => {`:** Renewed relay credentials reach connections that are already open.
- **Line 63, above `get relayAvailable(): boolean {`:** True once the worker has handed out relay (TURN) credentials.
- **Line 73, above `joinPair(code: string): void {`:** Joins a private room shared with whoever enters the same six-digit code.
- **Line 79, above `joinTrust(token: string): void {`:** Joins the secret room shared with a trusted device.
- **Line 86, above `leaveTrust(token: string): void {`:** Stops looking for a trusted device.
- **Line 97, above `trustedPeer(token: string): RemotePeer | undefined {`:** The device currently online in a trusted room, if any.
- **Line 104, above `trustTokenOf(peerId: string): string | null {`:** The trusted-room token this device was found through, or null if it is not trusted.
- **Lines 112-116, above `async offerTrust(`:** Asks a connected device to become a trusted device. Resolves with their answer; when it is 'accepted' this device has already joined the shared room and the caller should store the token.
- **Line 139, above `}`:** Channel already gone.
- **Line 154, above `answerTrust(peerId: string, xid: string, token: string, accepted: boolean): void {`:** Replies to a trustoffer event. Accepting joins the shared room.
- **Line 159, above `}`:** Channel already gone: the other device will time out.
- **Line 164, above `async revokeTrust(token: string): Promise<void> {`:** Tells any online devices in a trusted room that this device no longer trusts them, then leaves it.
- **Line 175, above `}`:** Offline or unreachable: they keep the entry until they remove it themselves.
- **Line 182, above `rename(name: string): void {`:** Changes this device's name and tells every room so other radars update.
- **Line 260, above `if (!this.isBusy(id)) {`:** An open link can finish its transfer even after the device leaves signaling.
- **Line 329, above `if (isToken(msg.token) && this.peers.get(peerId)?.rooms.has(trustRoom(msg.token))) {`:** Only a device found through that trusted room can revoke it.
- **Line 369, above `export function signalingEndpoint(): string {`:** The signaling endpoint: same origin by default, overridable at build time.

### `src/lib/transfer/ice.ts`

- **Lines 10-14, above `export class IceProvider extends Emitter<{ updated: [RTCIceServer[]] }> {`:** Keeps a current list of ICE servers from the signaling worker's /ws/ice endpoint, including short-lived relay (TURN) credentials when the worker has a TURN key, and fetches fresh ones before they expire.
- **Line 52, above `}`:** Offline or blocked: keep the servers we have and try again shortly.
- **Line 58, above `export function iceEndpoint(signalUrl: string): string {`:** /ws on the signaling host becomes /ws/ice/ over HTTP(S).

### `src/lib/transfer/identity.ts`

- **Lines 32-33, above `function sessionValue(key: string, make: () => string): string {`:** Per tab, so two tabs in one browser show up as two devices. Storage can be unavailable (private mode, blocked site data): fall back to a fresh value.
- **Lines 82-83, above `const NAME_KEY = 'anyairdrop:devicename';`:** A name the person chose is kept on this device for good (localStorage). Without one, each tab gets a random friendly name.
- **Line 87, above `export function cleanName(raw: string): string {`:** Trims a typed name, drops control characters and limits its length.
- **Lines 100-103, above `export function saveName(raw: string): string {`:** Remembers a new name for this device. An empty name clears the saved one, so the device goes back to its random name. Returns the name now in use.
- **Line 115, above `}`:** Storage blocked: the name still applies until the page is closed.

### `src/lib/transfer/link.ts`

- **Line 19, above `forceRelay?: boolean;`:** Testing aid: send everything through the relay even when a direct path exists.
- **Lines 23-24, above `const HIGH_WATER = 4 * 1024 * 1024;`:** Keep a few MB queued so the network stays busy without holding a whole file in memory. A smaller queue also means a cancel takes effect sooner on a slow connection.
- **Lines 28-31, above `export class PeerLink extends Emitter<LinkEvents> {`:** A WebRTC connection to one other device, with one ordered, reliable data channel. Uses the "perfect negotiation" pattern so either side can start the connection.
- **Lines 49-50, above `this.pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: forceRelay ? 'relay' : 'all' });`:** With relay servers in the list, ICE still prefers a direct path and only falls back to the relay when the network blocks one.
- **Line 52, above `this.dc = this.pc.createDataChannel('files', { negotiated: true, id: 0, ordered: true });`:** Both sides create the same pre-negotiated channel, so neither waits for the other's.
- **Lines 95-98, above `updateIceServers(iceServers: RTCIceServer[]): void {`:** Swaps in fresh ICE servers, e.g. renewed relay credentials. If the connection has already failed or dropped, retries it so the new servers get a chance.
- **Line 111, above `get chunkSize(): number {`:** Largest message every browser in use accepts; Safari is the strictest.
- **Line 118, above `this.queue = this.queue`:** Process in arrival order: a candidate must never overtake its description.
- **Line 146, above `return new Promise((resolve, reject) => {`:** Creating the channel already queued negotiation; just wait for it to open.
- **Lines 179-182, above `async stats(): Promise<{ route: Route; rttMs: number | null; viaTcp: boolean }> {`:** How the bytes travel (same network, across the internet, or through a relay), the round-trip delay of that path and whether it runs over TCP, which is slower than UDP.

### `src/lib/transfer/signaling.ts`

- **Line 24, above `export class SignalingRoom extends Emitter<SignalingEvents> {`:** One WebSocket to one signaling room, with keep-alive and automatic reconnect.
- **Line 45, above `rehello(): void {`:** Tells the room this device's details changed (for example, it was renamed).
- **Line 99, above `if (this.stopped || event.code === 4000) return;`:** 4000 = another tab with the same device id took over this connection.

### `src/lib/transfer/sinks.ts`

- **Line 1, above `export interface Sink {`:** Where incoming file bytes are written while they arrive.
- **Line 8, above `const DISK_THRESHOLD = 32 * 1024 * 1024;`:** Below this size, holding the file in memory is simplest and fast everywhere.
- **Lines 36-37, above `const DISK_BLOCK = 1024 * 1024;`:** Network messages are 64 KB, but the file system is much faster (often 2 to 3 times) when it is given a megabyte at a time, and phones are slowest at small writes.
- **Lines 40-41, above `class DiskSink implements Sink {`:** Large files stream into the browser's private file system (OPFS) instead of memory, so multi-gigabyte videos don't exhaust a phone's RAM.
- **Line 96, above `const keys = (dir as unknown as { keys(): AsyncIterable<string> }).keys();`:** Remove files left behind by earlier visits (other tabs' entries start with their id).
- **Line 123, above `}`:** Fall through to memory, e.g. when storage quota is exceeded.

### `src/lib/transfer/transfer.ts`

- **Lines 17-18, above `export type Control =`:** Control messages travel as JSON on the same ordered channel as the binary chunks, so "file", the chunks and "eof" always arrive in the order they were sent.
- **Line 23, above `| { t: 'prog'; xid: string; n: number }`:** The receiver tells the sender how many bytes have actually arrived, so both bars agree.
- **Lines 25-26, above `| { t: 'trust-offer'; xid: string; token: string; auto?: boolean }`:** Trusted devices: one side proposes a secret room token, the other accepts or declines. Either side can later revoke it.
- **Line 40, above `export function validateOffer(msg: { files?: unknown }): { files: FileMeta[]; total: number } | null {`:** Checks an incoming offer and makes its file names safe to save.
- **Line 65, above `private readonly abort = new AbortController();`:** Wakes a send that is waiting for the buffer to drain, so a cancel takes effect at once.
- **Lines 77-78, above `private confirmed = 0;`:** Bytes the receiver says it has received. Once these arrive they are the progress shown, not what this side has queued, which can run megabytes ahead on a slow connection.
- **Line 98, above `async run(onAccepted: () => void): Promise<'done' | 'declined' | 'busy'> {`:** Resolves when the receiver confirms every file, or with their refusal.
- **Lines 116-117, above `const read = (from: number): Promise<ArrayBuffer> => {`:** The next block is read while the current one is sent, so a slow disk or photo library never leaves the network waiting.
- **Line 120, on `block.catch(() => {});`:** A cancelled transfer never awaits it.
- **Line 129, above `const piece = new Uint8Array(block, start, Math.min(chunk, block.byteLength - start));`:** A view onto the block: no copy per message.
- **Lines 134-135, above `if (!this.receiverReports) {`:** Until the receiver reports (an older page on the other device never does), show what has left the buffer, not what is merely queued.
- **Line 163, above `}`:** Channel already gone.
- **Line 254, above `const now = performance.now();`:** Tell the sender how much has really arrived, a few times a second.
- **Line 291, above `}`:** Channel already gone.

### `src/lib/transfer/trusted.ts`

- **Lines 1-6, above `export interface TrustedDevice {`:** Trusted devices. Two devices that trust each other share a secret room token. Each joins that room whenever AnyAirDrop.com is open, so they find each other on any network, including through different VPNs. The token never leaves the two devices except as the name of that room.
- **Line 8, above `token: string;`:** 64 hex characters: the secret name of the shared signaling room.
- **Line 13, above `autoAccept: boolean;`:** Accept transfers from this device without asking. Off unless the person turns it on.
- **Line 18, above `export interface TrustedRow extends TrustedDevice {`:** A trusted device plus whether it is online right now (for the list on screen).
- **Line 54, above `export function saveTrusted(list: TrustedDevice[]): boolean {`:** Returns false when the browser would not store the list (private mode, blocked data).
- **Line 66, above `export function loadAutoTrust(): boolean {`:** After a completed transfer, remember the other device as trusted. On unless switched off.
- **Line 80, above `}`:** Storage blocked: the choice lasts until the page is closed.

### `src/lib/zip.ts`

- **Lines 10-11, above `const MEMORY_LIMIT = 1024 * 1024 * 1024;`:** Without a save dialog the archive is built in memory before it downloads, so very large ones are refused there and can still be saved file by file.
- **Line 14, above `export function uniqueNames(names: string[]): string[] {`:** Makes names unique inside the archive: "a.pdf", "a (2).pdf", "a (3).pdf".
- **Lines 33-37, above `export async function saveAsZip(files: ZipInput[], zipName: string): Promise<ZipResult> {`:** Packs the files into one ZIP and saves it. Files are stored as they are (no extra compression), which is fast and does not hurt photos, videos or documents that are already compressed. Where the browser has a save dialog the ZIP streams straight to disk.
- **Line 54, above `}`:** The dialog is unavailable here (for example, in a frame): fall back to a download.

## Site code and styles

### `src/config.ts`

- **Line 1, above `export const CONTACT_EMAIL = 'hello@anyairdrop.com';`:** Site-wide settings used by more than one page.
- **Lines 3-6, above `export const CONTACT_EMAIL = 'hello@anyairdrop.com';`:** The public contact address. It must exist as a mailbox or forwarder in cPanel (Email Accounts or Forwarders), otherwise messages sent to it bounce.
- **Line 11, above `export const FOUNDER = {`:** The person behind the site: shown on the About and Contact pages and in structured data.
- **Lines 19-22, above `export const PROJECTS = [`:** Other projects by the same person. They are linked as ordinary links (no nofollow), so they also count as references to those sites.
- **Line 41, above `export function listSeparator(i: number, n: number): string {`:** "A", "A and B" or "A, B and C": the separator that goes after item i of n.
- **Lines 47-58, above `export const ADSENSE_PUBLISHER_ID = '';`:** Go-live switch for Google AdSense. Leave both values empty until the AdSense account exists: the site then has no ads, no AdSense tags, no ads.txt, and the policy pages say so. To go live, set both in one commit: ADSENSE_PUBLISHER_ID the publisher ID, like 'ca-pub-1234567890123456' ADS_LIVE_SINCE today's date as 'YYYY-MM-DD' (shown as "Last updated" on the policy pages) The next deploy then switches on together: the verification meta tag on every page, the ads on guide pages (never the homepage, never a page with the transfer tool), /ads.txt, and the matching wording in the Privacy, Terms and Editorial policy pages. If one of the two values is missing or malformed the build fails on purpose, so a half-configured site never reaches the live server.
- **Lines 70-74, above `export const ADSENSE_SLOTS = { top: '', middle: '', end: '' };`:** Ad unit IDs (the `data-ad-slot` numbers) from AdSense > Ads > By ad unit, for the three places inside a guide: after the introduction, at the midpoint and before "Keep reading". An empty one is simply not shown, so Auto ads alone also work.
- **Lines 77-80, above `export const LEGAL_UPDATED = ADS_ENABLED`:** Shown on the Privacy and Terms pages. Once ads are live it follows ADS_LIVE_SINCE; if those pages change again later, update ADS_LIVE_SINCE to that day.

### `src/content.config.ts`

- **Line 7, above `loader: glob({ pattern: '*/index.md', base: './content/blog' }),`:** Only folders with an index.md. Older drafts written as index.mdx are left out until they are ready.
- **Line 12, above `description: z.string().min(80).max(175),`:** Shown in search results; aim for 120 to 160 characters.
- **Line 15, above `order: z.number().int().min(1),`:** Order inside its topic page, 1 first.
- **Line 21, above `related: z.array(z.string()).min(2).max(4),`:** Slugs of two to four closely related posts, shown at the end.
- **Lines 24-27, above `tested: z`:** First-hand testing behind the guide, shown as a "How we tested" box. Only fill it in from a real test session: every value must be something that was actually done and measured.
- **Line 36, above `embedTool: z.boolean().default(false),`:** Mounts the transfer tool above the article. Ads are never loaded on such a page.

### `src/lib/blog.ts`

- **Line 6, above `export async function getPosts(): Promise<Post[]> {`:** Published posts only: drafts and posts dated in the future stay out of every page and the sitemap.
- **Line 19, above `export function readingMinutes(post: Post): number {`:** Whole minutes to read the post at an easy 220 words a minute, never less than one.

### `src/lib/topics.ts`

- **Line 1, above `export const TOPICS = {`:** The five topics the blog covers. The key is used in frontmatter and in /blog/topic/<key>/.

### `src/styles/global.css`

- **Line 1, above `:root {`:** Quiet Radar tokens. Source: design-system/anyairdrop/MASTER.md
- **Line 5, above `--color-bg: #f8fafc;`:** Light theme: also the fallback when the device's preference is unknown
- **Lines 20-21, above `--qr-frame: #0b1220;`:** QR code: always dark modules on a white tile (every scanner reads it). The frame around the tile is what separates it from the page.
- **Line 25, above `--font-brand: 'Unbounded Variable', 'Unbounded', var(--font-sans);`:** Only for the logo wordmark.
- **Line 27, above `--color-brand: #2563eb;`:** The logo's blue: the accent on light, a touch brighter on dark so it keeps its contrast.
- **Lines 46-47, above `@media (prefers-color-scheme: dark) {`:** Dark theme. Applied when the device prefers dark and the visitor has not chosen light, or when the visitor chose dark with the toggle (data-theme="dark").

## Signaling worker

### `signaling/.dev.vars.example`

- **Lines 1-2, above `TURN_KEY_ID=`:** Copy to signaling/.dev.vars (git-ignored) to test the relay locally. From the Cloudflare dashboard: Realtime > TURN keys > Create.
- **Lines 6-7, end of file:** Optional: let pages on other origins fetch /ws/ice (comma-separated). ALLOWED_ORIGINS=https://anyairdrop.com,https://www.anyairdrop.com

### `signaling/src/ice.ts`

- **Lines 1-3, above `export interface IceEnv {`:** Hands browsers the ICE servers they need: STUN to find a direct path, and short-lived Cloudflare Realtime TURN credentials so a relay can carry the transfer when a network blocks direct connections. The long-term TURN key never leaves the worker.
- **Line 24, above `const RETRY_AFTER_ERROR_MS = 10 * 60 * 1000;`:** After a failed credential request, have clients ask again in a few minutes.
- **Lines 40-41, above `if (env.ICE_LIMITER) {`:** Credentials cost nothing to mint but relay traffic is billed, so cap how fast any one address can collect them.
- **Lines 75-77, above `function corsHeaders(request: Request, env: IceEnv): Record<string, string> | null {`:** The page normally calls this on its own origin. A browser request from any other site is refused unless that origin is listed in ALLOWED_ORIGINS (comma-separated). Requests without fetch metadata (non-browser clients) still go through the rate limit.
- **Lines 100-101, above `function sanitize(input: unknown): IceServer[] {`:** Keep only well-formed entries, and drop alternate port 53, which browsers block and would otherwise time out on.

### `signaling/src/index.ts`

- **Line 22, above `if (url.pathname === '/ws/ice' || url.pathname === '/ws/ice/') return handleIce(request, env);`:** The trailing-slash form matches the site's URL style, so it passes the Astro dev proxy.
- **Lines 30-32, above `const code = url.searchParams.get('pair');`:** A pairing code puts two devices in their own room, wherever they are. A trusted-device token (64 random hex characters, known only to devices that trust each other) does the same, permanently. Without either, devices behind the same network address share a room.
- **Line 54, above `ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));`:** Keep-alive pings are answered without waking the object.
- **Line 81, above `for (const other of this.ctx.getWebSockets()) {`:** A reload or reconnect replaces the old socket for the same device.
- **Line 105, above `}`:** Already closed.
- **Line 141, above `}`:** The socket is closing; its close handler will clean up.
- **Lines 163-165, above `async function networkKey(ip: string | null): Promise<string> {`:** Devices on one Wi-Fi share a public IPv4 address, or an IPv6 /64 prefix. The key is hashed so raw addresses never become room names. Private and loopback addresses (local development) all share one room.
- **Lines 196-199, above `async function whoami(request: Request): Promise<Response> {`:** Diagnostics for "why don't my two devices see each other?": which address family this connection arrives on and a short label for the shared-network room it would join. Devices only find each other automatically when their labels match. The address itself is never returned.

### `signaling/test/ice.test.mjs`

- **Line 1, above `const base = process.argv[2] ?? 'http://127.0.0.1:8787/ws/ice/';`:** Checks the relay-credential endpoint. Works with or without a TURN key configured.

### `signaling/test/rooms.test.mjs`

- **Line 1, above `const base = process.argv[2] ?? 'ws://127.0.0.1:8787/ws';`:** Exercises the signaling worker directly: pairing-room isolation, signal relay, leave events.
- **Lines 21-22, above `async function until(predicate, ms = 4000) {`:** Poll instead of sleeping a fixed time, so the test also works against the deployed worker, where messages take a network round trip.
- **Line 34, above `const code = String(100000 + Math.floor(Math.random() * 800000));`:** Random codes, so a run against production never lands in a real user's pairing room.
- **Line 67, above `const token = hex(32);`:** Trusted devices: a secret 64-hex token is a permanent private room, wherever the devices are.
- **Line 81, above `t1.ws.send(JSON.stringify({ type: 'hello', id: t1.id, name: 'Renamed', device: 'phone', os: 'Test', browser: '`:** A rename is a second hello on the same socket; the others see the new name.

### `signaling/wrangler.jsonc`

- **Lines 2-5, above `"$schema": "../node_modules/wrangler/config-schema.json",`:** Signaling server for AnyAirDrop.com: introduces devices to each other so their browsers can open a direct WebRTC connection, and hands out short-lived relay (TURN) credentials for networks that block direct connections. File data never passes through this worker.
- **Line 14, above `"ratelimits": [`:** Caps how often one address can fetch relay credentials from /ws/ice.
- **Line 19, above `"TURN_TTL": "14400"`:** How long relay credentials stay valid, in seconds. Browsers refresh them before then.
- **Lines 22-26, above `"observability": { "enabled": true },`:** Relay secrets (Cloudflare dashboard > Realtime > TURN keys). Without them the worker serves STUN only and everything else keeps working: npx wrangler secret put TURN_KEY_ID --config signaling/wrangler.jsonc npx wrangler secret put TURN_KEY_API_TOKEN --config signaling/wrangler.jsonc Locally, put them in signaling/.dev.vars (see .dev.vars.example).
- **Lines 28-30, above `"routes": [`:** /ws/whoami/ reports which shared-network group a device lands in (see ?debug=1). The site's pages come from the cPanel host behind Cloudflare's proxy; only /ws and /ws/ice/ on these hostnames reach this worker.

## Build, deploy and config

### `.github/workflows/deploy.yml`

- **Lines 1-7, above `name: Deploy`:** Checks, builds and deploys AnyAirDrop.com on every push to main. - Pages: built with Astro, uploaded to the cPanel host over FTPS (only changed files). - Signaling worker: deployed to Cloudflare, but only when its code changes, because a deploy restarts the worker and briefly disconnects everyone's device list. Repository secrets: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- **Line 74, above `echo "worker=true" >> "$GITHUB_OUTPUT"`:** First push or rewritten history: no reliable diff, so deploy to be safe.
- **Lines 100-104, above `- name: Test the FTP connection`:** The host runs ProFTPD, which insists that the file-data connection reuse the login connection's TLS session. lftp handles that; the earlier upload action did not and was reset ("ECONNRESET (data socket)"). TLS 1.2 keeps session reuse simple. The certificate is issued for the host's own name, not the bare IP, so it is not verified here: the connection is still encrypted.
- **Line 119, above `if ! lftp -u "$FTP_USERNAME,$LFTP_PASSWORD" "ftp://$FTP_SERVER" > ftp-test.log 2>&1 <<'EOF'`:** Log to a file so a failure can be shown as a readable annotation (without the password).
- **Lines 142-143, above `- name: Upload the site over FTPS`:** The FTP account is locked to /home/wiserw/anyairdrop.com, so its root is the site. Mirror makes the server match dist/ exactly, but leaves the folders cPanel manages.
- **Line 188, above `run: |`:** Report a failure as a readable annotation: job logs need a GitHub login to view.

### `.github/workflows/health.yml`

- **Lines 1-5, above `name: Health check`:** Weekly check that the live site still works, even when nobody has pushed code. A failure sends the usual GitHub failure email. Run it by hand from the Actions tab. GitHub pauses scheduled workflows in a public repository after 60 days without activity; if the emails stop, re-enable this workflow in the Actions tab.
- **Lines 28-29, above `- name: Run the checks`:** Each check is tried three times, 20 seconds apart, so a short blip at Cloudflare or the host does not raise a false alarm.

### `.gitignore`

- **Line 1, above `logs`:** Logs
- **Line 9, above `report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json`:** Diagnostic reports (https://nodejs.org/api/report.html)
- **Line 12, above `pids`:** Runtime data
- **Line 18, above `lib-cov`:** Directory for instrumented libs generated by jscoverage/JSCover
- **Line 21, above `coverage`:** Coverage directory used by tools like istanbul
- **Line 25, above `.nyc_output`:** nyc test coverage
- **Line 28, above `.grunt`:** Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
- **Line 31, above `bower_components`:** Bower dependency directory (https://bower.io/)
- **Line 34, above `.lock-wscript`:** node-waf configuration
- **Line 37, above `build/Release`:** Compiled binary addons (https://nodejs.org/api/addons.html)
- **Line 40, above `node_modules/`:** Dependency directories
- **Line 44, above `web_modules/`:** Snowpack dependency directory (https://snowpack.dev/)
- **Line 47, above `*.tsbuildinfo`:** TypeScript cache
- **Line 50, above `.npm`:** Optional npm cache directory
- **Line 53, above `.eslintcache`:** Optional eslint cache
- **Line 56, above `.stylelintcache`:** Optional stylelint cache
- **Line 59, above `.node_repl_history`:** Optional REPL history
- **Line 62, above `*.tgz`:** Output of 'npm pack'
- **Line 65, above `.yarn-integrity`:** Yarn Integrity file
- **Line 68, above `.env`:** dotenv environment variable files
- **Line 73, above `.cache`:** parcel-bundler cache (https://parceljs.org/)
- **Line 77, above `.next`:** Next.js build output
- **Line 81, above `.nuxt`:** Nuxt.js build / generate output
- **Line 86, above `.cache/`:** Gatsby files
- **Lines 88-90, above `.vuepress/dist`:** Comment in the public line in if your project uses Gatsby and not Next.js https://nextjs.org/blog/next-9-1#public-directory-support public
- **Line 92, above `.vuepress/dist`:** vuepress build output
- **Line 95, above `.temp`:** vuepress v2.x temp directory
- **Line 98, above `.svelte-kit/`:** Sveltekit cache directory
- **Line 101, above `**/.vitepress/dist`:** vitepress build output
- **Line 104, above `**/.vitepress/cache`:** vitepress cache directory
- **Line 107, above `.docusaurus`:** Docusaurus cache and generated files
- **Line 110, above `.serverless/`:** Serverless directories
- **Line 113, above `.fusebox/`:** FuseBox cache
- **Line 116, above `.dynamodb/`:** DynamoDB Local files
- **Line 119, above `.firebase/`:** Firebase cache directory
- **Line 122, above `.tern-port`:** TernJS port file
- **Line 125, above `.vscode-test`:** Stores Visual Studio Code versions used for testing Visual Studio Code extensions
- **Line 128, above `.pnpm-store`:** pnpm
- **Line 131, above `.pnp.*`:** yarn v3
- **Line 140, above `vite.config.js.timestamp-*`:** Vite files
- **Line 145, above `.astro/`:** Astro generated types
- **Line 148, above `.turbo`:** Turbo Repo
- **Line 151, above `.wrangler/`:** AnyAirDrop.com project
- **Line 157, above `*Sample.txt`:** Saved copies of competitor pages used as design references, not project code

### `astro.config.mjs`

- **Line 1, above `import { defineConfig } from 'astro/config';`:** @ts-check
- **Lines 7-9, above `const lan = process.argv.includes('--host');`:** `npm run dev:lan` passes --host so phones on your Wi-Fi can open the dev site. Browsers only allow storage and wake-lock APIs on HTTPS (or localhost), so LAN mode serves a self-signed certificate.
- **Lines 16-17, above `compressHTML: false,`:** Compression drops the space when a link starts on a new line in the source, which glues words together ("runs<a>WiserWork</a>"). Browsers collapse the whitespace themselves.
- **Lines 23-24, above `proxy: {`:** The signaling worker runs on :8787 (`npm run signal`). Proxying it keeps the page and its WebSocket on one origin, in dev and in production.

### `public/.htaccess`

- **Line 1, above `<Files ".ftp-deploy-sync-state.json">`:** Apache settings for the cPanel host.
- **Line 3, above `<Files ".ftp-deploy-sync-state.json">`:** The GitHub deploy keeps a list of uploaded files here; it is not for visitors.
- **Lines 8-9, above `<IfModule mod_headers.c>`:** Built scripts, styles and fonts have a content hash in their names, so a new version always gets a new name and browsers can keep these for a year.
- **Lines 16-17, above `<IfModule mod_rewrite.c>`:** Old Blogger-style URLs from the domain's previous owner: gone for good (410), so search engines drop them instead of retrying. None of these paths exist on this site.

### `scripts/check-content.mjs`

- **Lines 1-3, above `import { readdirSync, readFileSync, existsSync } from 'node:fs';`:** Runs before every build (npm "prebuild"). Fails the build, and so the deploy, when a published guide still has a TODO or screenshot placeholder in it, or links to a page of this site that does not exist. Drafts (draft: true) are skipped: they are allowed to be unfinished.

### `scripts/indexnow.mjs`

- **Lines 1-8, above `import { readFileSync, readdirSync, existsSync } from 'node:fs';`:** Tells search engines that support IndexNow (Bing, Yandex, Seznam, Naver and others) that pages were added or changed, so they are crawled sooner. Run it after a deploy: npm run indexnow every page in the sitemap npm run indexnow -- https://anyairdrop.com/about/ only the pages you list The key is not a secret: IndexNow checks it by fetching the key file from the site, so the file in public/ must be live before this runs.
- **Line 48, above `console.log('${response.status} ${response.statusText}: submitted ${urls.length} page${urls.length === 1 ? '' `:** 200 and 202 mean accepted. 403 means the key file could not be verified, 422 a bad address.

## Docs and content

### `content/blog/airdrop-to-android/index.md`

- **Lines 28-40, above `If your Android phone is a recent Pixel or Galaxy, you can now AirDrop to it directly: it shows up in the iPho`:** PUBLISH CHECKLIST (delete this block when done) 1. Add the `tested` block to the frontmatter and fill the timed-results table with real test data. Never estimate. 2. Replace every SCREENSHOT comment with a real screenshot from the shipped tool. 3. Re-check the Quick Share supported-phone list against Google and Samsung on publish day. 4. Verify on real phones: Quick Share and AirDrop work without a shared Wi-Fi network; "Save as Video" for Live Photos; where Downloads land on Pixel and Galaxy; the Quick Settings path to Quick Share visibility on Pixel and on Galaxy (One UI); whether some phones need a separate "share with Apple devices" switch; "Copy iCloud Link" in the iPhone Photos share sheet; cross-platform speed vs our own timings. 5. Confirm the AnyAirDrop steps match the shipped UI (device names, Accept prompt, QR pairing). 6. Set publishDate to the go-live day and set draft: false.
- **Lines 93-96, above `If the Android phone doesn't appear in step 3, tap **Pair with code** on one phone and scan the QR code with t`:** SCREENSHOT 1: both phones on AnyAirDrop.com, each showing the other device's name. SCREENSHOT 2: iPhone picker with several photos selected. SCREENSHOT 3: Android Accept prompt showing file count and total size. SCREENSHOT 4: Android Downloads folder in Files by Google with the received photos.
- **Lines 139-140, above `### Steps: supported Android phone to iPhone`:** SCREENSHOT 5: Android Quick Share visibility set to Everyone for 10 minutes. SCREENSHOT 6: iPhone AirDrop sheet showing the Android phone.
- **Line 154, on `- **Early reports say it's slower than iPhone-to-iPhone AirDrop.** For photos and short clips you won't notice`:** TODO: confirm with our own timed test.
- **Line 198, on `| Quick Share with AirDrop | Yes | None stated | No  |`:** TODO: verify on real phones
- **Line 204, on `We timed each direct method with the same files on the same network.`:** TODO: insert the timed-results table and the speed chart (images/speed-test.png) from the real test. Columns: method, 50 HEIC photos, 1 GB 4K video, notes. Do not publish this section without real numbers.

### `design-system/anyairdrop/MASTER.md`

- **Line 22, above `--color-bg: #F8FAFC;          /* page */`:** Color
- **Line 23, on `--color-bg: #F8FAFC;`:** page
- **Line 24, on `--color-surface: #FFFFFF;`:** device circles, sheets, secondary buttons
- **Line 25, on `--color-text: #0F172A;`:** headings, body
- **Line 26, on `--color-text-muted: #475569;`:** secondary text, nav, footer (7.2:1 on bg)
- **Line 27, on `--color-line: #E2E8F0;`:** radar rings, dividers, button borders
- **Line 28, on `--color-line-strong: #CBD5E1;`:** idle device ring
- **Line 29, on `--color-accent: #2563EB;`:** You, primary button, links, selected device
- **Line 31, on `--color-on-accent: #FFFFFF;`:** 5.2:1 on accent
- **Line 32, on `--color-success: #15803D;`:** sent check only
- **Line 33, on `--color-scrim: rgba(15, 23, 42, 0.25);`:** behind phone bottom sheet
- **Line 35, above `--font-sans: "Inter", system-ui, sans-serif;`:** Type
- **Line 37, on `--text-h1: 600 44px/1.12 var(--font-sans);`:** 34px under 720px, 28px in phone layout
- **Line 44, above `--space-1: 8px;  --space-2: 12px; --space-3: 16px; --space-4: 24px;`:** Space (8px rhythm)
- **Line 49, above `--radius-button: 10px;  /* 12px in phone layout */`:** Shape
- **Line 50, on `--radius-button: 10px;`:** 12px in phone layout
- **Line 51, on `--radius-sheet: 20px;`:** top corners of the phone bottom sheet
- **Line 53, above `--dur-color: 200ms;     /* hover/focus color changes */`:** Motion
- **Line 54, on `--dur-color: 200ms;`:** hover/focus color changes
- **Line 55, on `--dur-enter: 350ms;`:** device appears, sheet slides up (300ms)
- **Line 56, on `--pulse: 3.2s;`:** one radar pulse loop


### `content/blog/webrtc-data-channels-explained/index.md`

- **Line 96, on `const CHUNK = 16 * 1024;`:** 16 KiB per message
- **Line 97, on `const HIGH_WATER = 1024 * 1024;`:** pause above 1 MiB queued
