# AdSense readiness: plan, status and rules

Source: "AnyAirDrop AdSense Fixes Proposal" (prepared October 23, 2026). Target application date:
about **November 20, 2026**, decided by Search Console, not the calendar. Fix IDs (A1, B2, ...)
below are the proposal's IDs.

**Automation ends on 2026-11-04.** The owner's cloud environment expires on November 5, so every
scheduled job runs by then and nothing runs after. Everything later (the apply gate, go-live, E2) is done by a person
using the checklists below. The jobs are: the test write-up (Nov 2, 3 and 4 at 12:17 UTC) and the final audit
(Nov 4 at 14:17 UTC). Nov 4 12:17 UTC is 15:47 in Tehran, so it still falls on Nov 4 there.

Step-by-step help for YouTube links, applying, the consent message and page speed: [adsense-setup-guide.md](adsense-setup-guide.md).

This file is the shared memory for the scheduled cloud jobs and for people. Update the status
column when something changes.

## Rules that must never be broken

1. **Never invent testing.** Every number, device, date and screenshot in a "How we tested" box
   must come from `testing/session.md`, filled in by a person. If it is missing, skip that guide.
2. **Never backdate.** The 35 existing guides keep their dates. New or finished guides get the
   real publish day (C3).
3. **Ads and policy change together.** The switch is `ADSENSE_PUBLISHER_ID` plus `ADS_LIVE_SINCE` in
   `src/config.ts`. Both empty = no ads, no AdSense tags, no `/ads.txt`, old policy wording. Both set =
   meta tag on every page, the ad script on guide pages only (never `/`, never a page with `embedTool: true`),
   `/ads.txt`, and the Privacy, Terms and Editorial policy wording about ads, dated `ADS_LIVE_SINCE`. The build
   fails if only one of them is set or either is malformed.
4. **Nobody but a person turns ads on.** Setting those two values is the go-live step. It is only done after the
   apply gate below is confirmed in Search Console and AdSense, which no cloud job can see.
5. Every push to `main` deploys to the live site. Run `npm run check` and `npm run build` first
   (the build runs `scripts/check-content.mjs`, which blocks TODOs, placeholders and broken links in
   published guides). `git pull --rebase origin main` before pushing: a person may be pushing too.
   Never force-push.

## Status

| ID | Fix | Who | Status |
| --- | --- | --- | --- |
| A1 | Search Console Domain property (DNS TXT in Cloudflare) | Person | Open |
| A2 | Submit `sitemap-index.xml`, check it lists everything and not the draft | Person | Open |
| A3 | Check Manual actions + Security issues, request indexing for key pages | Person | Open |
| A4 | Old Blogger URLs return 410 | **Accepted as 404** | Decided 2026-10-24. The host ignores the `.htaccess` 410 rule, and Cloudflare's Free plan cannot return 410 (a custom Block response and Custom Error Rules are Pro-and-above features; plain Block would send a 403 block page, which is worse). Google treats 404 and 410 nearly the same, so this is not a blocker. Do NOT add a Cloudflare Block rule for these paths. Still worth doing: look the old domain up in the Wayback Machine and watch Search Console's Pages report for old Blogger-style URLs (`/2022/09/...html`, `/search/label/...`, `/feeds/...`) |
| B1 | Privacy policy: Advertising section | Done in code | Staged behind `ADS_ENABLED` |
| B2 | Google-certified consent message (EEA, UK, Switzerland) | Person, in AdSense: Privacy & messaging | Open, week 4 |
| B3 | Editorial policy wording about ads | Done in code | Staged behind `ADS_ENABLED` |
| B4 | Terms line about third-party ads | Done in code | Staged behind `ADS_ENABLED` |
| B5 | `hello@anyairdrop.com` receives mail (send a test from outside) | Person | Open |
| C1 | First-hand testing in 10 guides | Person tests; scheduled job writes it up | Waiting for `testing/session.md`. **Must be filled in before Nov 4, 12:00 UTC**: after that no job writes it up, and a person (or a new session) must do it by hand |
| C2 | Finish and publish "How to AirDrop to Android" | Code done; content needs C1 data | Draft in `content/blog/airdrop-to-android/` |
| C3 | Publish new guides at a steady pace (about 2 a week) | Person | Not automated, on purpose: see below |
| C4 | Keep the AI-assistance disclosure | Nothing to do | Kept |
| C5 | Homepage: How it works, FAQ, Popular guides | **Done 2026-10-29, reversed from the earlier decision** | The owner asked for it again. Below the transfer tool the homepage has How it works, Why people use it, What our server sees, four questions and three guides, and it scrolls normally. The About page was rebuilt on 2026-10-31 with the founder photo, the YouTube channel and how the site is paid for |
| D1 | Apply only when the gate is met | Person | Week 4 |
| D2 | AdSense meta tag on every page | Done in code | Staged behind `ADS_ENABLED` |
| D3 | Ads on guide pages only, never on the tool | Done in code | Staged behind `ADS_ENABLED` |
| D4 | Ad slots inside articles (after intro, midpoint, before "Keep reading") | Done in code | Staged: fill `ADSENSE_SLOTS` in `src/config.ts` with the ad unit IDs, or rely on Auto ads |
| E1 | `ads.txt` with the exact line AdSense gives you | Automatic | `/ads.txt` is generated from the publisher ID on go-live, so there is nothing to do. Check it loads |
| E2 | Weekly Policy center / Search Console check for a month | Person | After approval |

C3 is not automated: a schedule that generates guides unattended is exactly the "scaled content"
pattern the proposal warns about. Guides need a person who tests and reviews them.

## Apply gate (every box before clicking Apply)

- [ ] Search Console: no manual actions, no security issues
- [ ] Search Console: homepage, /blog/ and most guides show as Indexed
- [ ] Privacy policy has the Advertising section and nothing on the site still says "no ads" (go-live deploy)
- [ ] Consent message for the EEA, UK and Switzerland is published in AdSense
- [ ] 10 guides have a real "How we tested" box, results and screenshots, every number measured
- [ ] "AirDrop to Android" is live, indexed, no TODOs
- [x] Homepage has How it works, FAQ and guides below the tool (done 2026-10-29)
- [ ] AdSense meta tag on every page, ad script on guide pages only
- [ ] A test email to hello@anyairdrop.com arrived
- [ ] Site crawled with no broken links; 5 topic pages and 10 random guides spot-checked on a phone

## Go-live (a person does this once the gate is met)

1. Create the AdSense account and add `anyairdrop.com`. Copy the publisher ID (`ca-pub-...`).
2. In `src/config.ts` (editable on GitHub) set `ADSENSE_PUBLISHER_ID` to it and `ADS_LIVE_SINCE` to today's date as
   `'YYYY-MM-DD'`. Optionally fill `ADSENSE_SLOTS` with the ad unit IDs. Commit to `main`. The deploy publishes the meta tag,
   the ads, `/ads.txt` and the matching policy text together. If the Deploy workflow fails with a message about
   `ADS_LIVE_SINCE` or `ADSENSE_PUBLISHER_ID`, one of the two values is missing or malformed: fix it and push again.
3. After the deploy, check by hand (view-source in a browser):
   - `https://anyairdrop.com/` has the `google-adsense-account` meta tag and no `adsbygoogle` script;
   - a guide such as `/blog/how-airdrop-works/` has the meta tag, the `adsbygoogle.js` script and the labelled ad boxes;
   - `https://anyairdrop.com/ads.txt` shows `google.com, pub-<digits>, DIRECT, f08c47fec0942fa0`;
   - `/privacy/` has an Advertising section.
4. In AdSense: verify the site (meta tag), publish the consent message (B2), exclude `/` from Auto ads if used.
5. Click Apply. Then (E2) check AdSense Policy center and Search Console Pages and Manual actions once a week for a month.
