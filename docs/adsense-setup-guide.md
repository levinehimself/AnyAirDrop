# AdSense setup guide: YouTube links, consent message and page speed

Written 2026-10-31 for the site owner. Companion to [adsense-readiness.md](adsense-readiness.md), which holds the status table and the apply gate. Google renames menu items now and then, so if a label below is not exactly where it says, look for the closest one.

## 1. Link your three websites and AnyAirDrop.com from YouTube

Google and reviewers both look for proof that the same person runs the channel and the sites. Link them in both directions.

**From the YouTube channel (about 5 minutes)**

1. Open YouTube Studio, then **Customization**, then **Basic info**.
2. Under **Links**, choose **Add** for each site: a short title and the full address.
   - AnyAirDrop.com: `https://anyairdrop.com/`
   - WiserWork: `https://wiserwork.org/`
   - Explore City Guides: `https://explorecityguides.com/`
   - Levine Tech Talks (the website): `https://levine-tech-talks.com/`
3. Put AnyAirDrop.com first. The first few links show next to the channel banner; the rest sit under About.
4. Under **Contact info**, add `hello@anyairdrop.com` so people and reviewers see a real address.
5. In the channel description, add one plain sentence such as "I also build AnyAirDrop.com, WiserWork and Explore City Guides", then **Publish**.

**From each website back to YouTube**

- AnyAirDrop.com: done. The About page links to the channel and to all three other projects.
- WiserWork, Explore City Guides and Levine Tech Talks: those sites are not in this repository, so add the same two things by hand on each: a footer or About link to `https://www.youtube.com/@Optimistic_lad/` and a link to `https://anyairdrop.com/`. Use ordinary links, not `nofollow`.

## 2. Applying to AdSense

1. **Check whether you already have an AdSense account.** If your YouTube channel is monetized (YouTube Partner Program), it pays out through an AdSense account, and one person can only have one. In that case sign in to [adsense.google.com](https://adsense.google.com) with that Google account and add the site from **Sites**, instead of creating a new account.
2. **Work through the apply gate** in `adsense-readiness.md`. The two items that most need you: Search Console shows the blog as Indexed with no manual actions, and the real "How we tested" boxes are filled in from `testing/session.md`.
3. **Apply.** Add `anyairdrop.com` as the site, pick your country and accept the terms. AdSense then shows a publisher ID that starts with `ca-pub-`.
4. **Go live** exactly as the section "Go-live" of `adsense-readiness.md` says: set `ADSENSE_PUBLISHER_ID` and `ADS_LIVE_SINCE` in `src/config.ts`, push to `main`, and let the deploy publish the verification tag, the ads, `/ads.txt` and the matching policy text together.
5. Back in AdSense, click **Verify** for the site, publish the consent message (next section), then **Request review**.
6. Review usually takes a few days and can take up to a few weeks. Do not change large parts of the site while it is in review.

## 3. The Google consent message (EEA, UK and Switzerland)

Google requires a Google-certified consent message before it will serve ads to visitors in the European Economic Area, the United Kingdom and Switzerland. AdSense includes a free one, so you do not need a separate consent tool.

1. In AdSense open **Privacy & messaging**.
2. Under **European regulations**, choose **Create message** and select `anyairdrop.com`.
3. Keep the default options (a message with **Consent** and **Manage options** or **Do not consent** buttons). You may change the colors and add your logo.
4. Make sure the privacy policy link points to `https://anyairdrop.com/privacy/`. The page already has an Advertising section that is switched on at go-live.
5. Choose **Publish**. A published message is what the apply gate asks for.
6. Optional but useful: create the **US state regulations** message in the same place, so California and other US visitors get an opt-out choice.
7. To test it, open a guide in a browser set to an EU country (a VPN or a browser extension that changes location works). The message should appear on a guide page.

How this fits the site: the AdSense script, and with it the message, only loads on guide pages. The homepage and the transfer tool never show it, which matches what the Privacy page says. Until go-live (both config values empty) nothing from Google loads at all.

## 4. Page-speed checks

**What was measured on 2026-10-31 (live site, from one location)**

| Check | Result | Verdict |
| --- | --- | --- |
| Compression | Brotli on HTML, CSS and JS | Good |
| File sizes | Homepage HTML 7.8 KB, CSS about 7 KB, tool JS 26 KB (compressed) | Good, very light |
| Browser caching | CSS, JS and fonts cached for a year with `immutable` through `.htaccess` | Good |
| Time to first byte | 0.9 to 1.6 seconds for HTML pages | Slow: the main thing to fix |
| Cloudflare edge cache | HTML shows `cf-cache-status: DYNAMIC`, so every visit goes to the cPanel host | Cause of the slow first byte |

Everything is small, so the first byte is the one real weakness. It is the biggest part of "Largest Contentful Paint" on a page this light.

**Fix: let Cloudflare cache the HTML (10 minutes)**

1. Cloudflare dashboard, `anyairdrop.com`, **Caching**, **Cache Rules**, **Create rule**.
2. Name it "Cache pages". Condition: **Hostname** equals `anyairdrop.com` **and** **URI Path** does not start with `/ws`. (The `/ws` path is the signaling worker and must never be cached.)
3. Action: **Eligible for cache**. Edge TTL: **Ignore cache-control header and use this TTL**, 1 hour. Leave Browser TTL on **Respect origin**.
4. Save, wait a minute, then run `curl -I https://anyairdrop.com/` twice. The second response should show `cf-cache-status: HIT`.
5. After each deploy the old HTML can stay for up to an hour. To see a change at once, use **Caching**, **Configuration**, **Purge Everything**. If you would rather have this automatic, create an API token with only **Zone, Cache Purge** permission and ask for a purge step to be added to the Deploy workflow.

**Check with Google's tools**

1. Open [pagespeed.web.dev](https://pagespeed.web.dev), paste `https://anyairdrop.com/` and run it for **Mobile**. Repeat for one guide, for example `/blog/how-wifi-works/`.
2. Aim for green on all three Core Web Vitals: Largest Contentful Paint under 2.5 s, Interaction to Next Paint under 200 ms, Cumulative Layout Shift under 0.1.
3. Run it again after the Cloudflare rule. The first-byte and LCP numbers should drop clearly.
4. In Search Console, **Experience**, **Core Web Vitals** fills in with real visitor data after about 28 days. Check it monthly.
5. Before go-live, re-run the guide page and compare. Ads add weight, so the ad slots reserve their height (`min-height` in `AdSlot.astro`) to avoid layout shift. Look at the CLS number after ads go live and report it back if it is above 0.1.
