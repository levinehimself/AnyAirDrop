# AdSense readiness: plan, status and rules

Source: "AnyAirDrop AdSense Fixes Proposal" (prepared October 23, 2026). Target application date:
about **November 20, 2026**, decided by Search Console, not the calendar. Fix IDs (A1, B2, ...)
below are the proposal's IDs.

This file is the shared memory for the scheduled cloud jobs and for people. Update the status
column when something changes.

## Rules that must never be broken

1. **Never invent testing.** Every number, device, date and screenshot in a "How we tested" box
   must come from `testing/session.md`, filled in by a person. If it is missing, skip that guide.
2. **Never backdate.** The 35 existing guides keep their dates. New or finished guides get the
   real publish day (C3).
3. **Ads and policy change together.** The switch is `ADSENSE_PUBLISHER_ID` in `src/config.ts`.
   Empty = no ads, no AdSense tags, old policy wording. Set = meta tag on every page, the ad
   script on guide pages only (never `/`, never a page with `embedTool: true`), and the Privacy,
   Terms and Editorial policy wording about ads. Bump `LEGAL_UPDATED` in the same commit.
4. **Nobody but a person turns ads on.** Setting the publisher ID is the go-live step. It is only
   done after the apply gate below is confirmed in Search Console and AdSense, which no cloud job can see.
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
| A4 | Old Blogger URLs return 410 (`public/.htaccess`) | Rule deployed; **not taking effect** | Checked 2026-10-24 after the deploy finished: `/2022/09/test.html` and `/search/label/test` still return LiteSpeed's 404 instead of 410. The host may ignore rewrite rules in `.htaccess`. Fallback: a Cloudflare custom rule (Security > WAF) for `starts_with(http.request.uri.path, "/search/label/") or starts_with(http.request.uri.path, "/feeds/") or http.request.uri.path matches "^/20[0-9]{2}/"` with action Block and a custom response of status 410. A person must add it. Also check the Search Console Pages report and the Wayback Machine |
| B1 | Privacy policy: Advertising section | Done in code | Staged behind `ADS_ENABLED` |
| B2 | Google-certified consent message (EEA, UK, Switzerland) | Person, in AdSense: Privacy & messaging | Open, week 4 |
| B3 | Editorial policy wording about ads | Done in code | Staged behind `ADS_ENABLED` |
| B4 | Terms line about third-party ads | Done in code | Staged behind `ADS_ENABLED` |
| B5 | `hello@anyairdrop.com` receives mail (send a test from outside) | Person | Open |
| C1 | First-hand testing in 10 guides | Person tests; scheduled job writes it up | Waiting for `testing/session.md` |
| C2 | Finish and publish "How to AirDrop to Android" | Code done; content needs C1 data | Draft in `content/blog/airdrop-to-android/` |
| C3 | Publish new guides at a steady pace (about 2 a week) | Person | Not automated, on purpose: see below |
| C4 | Keep the AI-assistance disclosure | Nothing to do | Kept |
| C5 | Homepage: How it works, FAQ, Popular guides | Done in code | Deployed once pushed |
| D1 | Apply only when the gate is met | Person | Week 4 |
| D2 | AdSense meta tag on every page | Done in code | Staged behind `ADS_ENABLED` |
| D3 | Ads on guide pages only, never on the tool | Done in code | Staged behind `ADS_ENABLED` |
| D4 | Ad slots inside articles (after intro, midpoint, before "Keep reading") | Done in code | Staged: fill `ADSENSE_SLOTS` in `src/config.ts` with the ad unit IDs, or rely on Auto ads |
| E1 | `public/ads.txt` with the exact line AdSense gives you | Scheduled job, once the ID is set | After go-live |
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
- [ ] Homepage has How it works, FAQ and Popular guides
- [ ] AdSense meta tag on every page, ad script on guide pages only
- [ ] A test email to hello@anyairdrop.com arrived
- [ ] Site crawled with no broken links; 5 topic pages and 10 random guides spot-checked on a phone

## Go-live (a person does this once the gate is met)

1. Create the AdSense account and add `anyairdrop.com`. Copy the publisher ID (`ca-pub-...`).
2. In `src/config.ts` set `ADSENSE_PUBLISHER_ID`, optionally the `ADSENSE_SLOTS`, and bump `LEGAL_UPDATED`
   to today. Commit to `main`. The deploy then publishes the meta tag, the ads and the matching policy text together.
3. In AdSense: verify the site (meta tag), publish the consent message (B2), exclude `/` from Auto ads if used.
4. Click Apply.
