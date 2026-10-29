# AnyAirDrop.com design system: Quiet Radar

Source of truth for every page. Chosen 2026-10-21 from the Design 6 canvas:
https://claude.ai/artifact/D2q129uHdJqK32VYGec8at

Page-specific overrides go in `design-system/anyairdrop/pages/<page>.md` and win over this file.

Built with UI UX Pro Max guidance: style "Minimalism & Swiss Style", landing pattern
"Minimal Single Column", density spacious, motion subtle.

## Principles

1. **The tool comes first.** The top of the homepage is the header, one headline, one line of copy, the radar and the pairing code row, so the tool is usable without scrolling. Below it, for readers and for AdSense review, sit plain-text sections separated by hairlines: how it works, why people use it, what the server sees, questions, and three guides. The page scrolls normally.
2. **One accent.** Blue marks only "You", primary buttons, links and the selected device.
3. **Thin, quiet, flat.** 1px hairlines, no shadows, no gradients, no cards on the homepage.
4. **Explain elsewhere.** FAQs, feature grids, how-it-works and comparisons live on guide pages, linked from the footer.

## Tokens

```css
:root {
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-line: #E2E8F0;
  --color-line-strong: #CBD5E1;
  --color-accent: #2563EB;
  --color-accent-hover: #1D4ED8;
  --color-on-accent: #FFFFFF;
  --color-success: #15803D;
  --color-scrim: rgba(15, 23, 42, 0.25);

  --font-sans: "Inter", system-ui, sans-serif;
  --text-h1: 600 44px/1.12 var(--font-sans);
  --text-lead: 400 18px/1.6 var(--font-sans);
  --text-ui: 500 15px/1.4 var(--font-sans);
  --text-label: 600 14px/1.3 var(--font-sans);
  --text-small: 400 13px/1.5 var(--font-sans);
  --tracking-h1: -0.03em;

  --space-1: 8px;  --space-2: 12px; --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 40px; --space-7: 48px; --space-8: 64px;
  --container: 1120px;

  --radius-button: 10px;
  --radius-sheet: 20px;

  --dur-color: 200ms;
  --dur-enter: 350ms;
  --pulse: 3.2s;
  --ease-out: ease-out;
}
```

## Components

| Component | Spec |
|---|---|
| Header | Logo left: 28px ring (2px accent) with an 8px accent dot, then "AnyAirDrop.com" 17px/600. Right: two text links only, "Guides" and "Help", 15px/500 muted. No border, no background |
| Headline block | Centered. H1 "Send files to nearby devices." One lead line under it, max 520px wide |
| Radar | Max 480px, 86vw on small screens, square. Three 1px rings at inset 0, 17%, 34%. One accent pulse (scale .2 to 1, opacity .16 to 0, 3.2s loop). Center: 60px accent circle reading "You" |
| Device | Real `<button>`. 52px white circle, 1px ring (`--color-line-strong`, accent when selected), 20px line icon (stroke 1.6), name below in 14px/600. Fades in over 350ms. Hit area at least 44px |
| Action area | Fixed min-height 112px under the radar so the page never jumps. States: hint text plus "Pair with a code" link → "Send 3 files (190 MB) to X?" with Cancel / Send → 4px progress bar with % and "Direct over your Wi-Fi · nothing uploaded" → check, "Sent to X", "Send more" |
| Primary button | Accent fill, white text, 44px min height, 10px radius, 15px/600 |
| Secondary button | White fill, 1px `--color-line` border, text color, same size |
| Benefits | One row of three, centered, above a 1px top divider: bold 15px line plus muted 14px line. Stacks under 720px |
| Footer | Guide links left, Privacy and Terms right, a disclaimer line full width in 12px muted: "AnyAirDrop.com is an independent service, not affiliated with or endorsed by Apple Inc. Apple's trademarks belong to Apple Inc." |
| Phone bottom sheet | Selecting a device opens a white sheet from the bottom over a 25% scrim: 36x4px handle, title, file summary, Cancel / Send. The same sheet shows progress, then "Sent" with Done |

## Rules

- Write the brand exactly "AnyAirDrop" / "AnyAirDrop.com" in visible text. URLs stay lowercase.
- Never write "AirDrop" on its own anywhere in the site UI, titles, descriptions, footer or URLs: always "AnyAirDrop" / "AnyAirDrop.com". Never use Apple's icons. The footer disclaims affiliation with Apple without naming Apple's products. (Blog posts that target "AirDrop" search terms are a separate decision for the trademark review.)
- Text contrast at least 4.5:1. Focus ring: 2px accent outline, 3px offset, on every button and link.
- Touch targets at least 44x44px, 8px apart.
- Respect `prefers-reduced-motion`: no pulse, no fade, final states shown at once.
- Line icons only (Lucide-style, stroke 1.6), never emoji.
- No ads, pop-ups or cookie banners on the homepage.

## Avoid

Cards and feature grids on the homepage, more than one accent color, shadows, gradients, big illustrations, stock photos, carousels, FAQ blocks above the footer, more than two header links.

## Update 2026-10-22: Urbanist, dark theme, header and footer

- **Font:** Urbanist (self-hosted via `@fontsource-variable/urbanist`), body 17px / weight 500, headings 700, H1 44px (36px in short windows, 34px on phones). Inter is no longer used.
- **Themes:** light and dark share the same tokens. Dark: bg #0B1220, surface #131C2E, text #F1F5F9, muted #A3B1C6, lines #1F2A3D / #33415A, link #7FB0FF, success #4ADE80. A saved choice (localStorage `anyairdrop:theme`) wins; otherwise the device's `prefers-color-scheme`; light if neither can be read. A header button toggles it. Use `--color-link` for blue text, `--color-accent` only for fills.
- **Header:** logo left; right: a small "Blog" link and the theme toggle. No other links.
- **Benefits row:** removed on 2026-10-23. The homepage holds only the headline, the radar and the pairing area; the benefits are explained on the About page.
- **Logo (chosen 2026-10-23, "Radar ping"):** a 3.5-unit ring, a centre dot and a short signal arc at the upper right, drawn in a 48-unit box (`viewBox="2.9 -1.9 48 48"` centres the visible shape). Blue `--color-brand`: #2563EB on light, #3B82F6 on dark. Wordmark "AnyAirDrop" in Unbounded 600 at 16px, tracking -0.03em, with ".com" in weight 500 and the muted text colour (changed from Space Grotesk on 2026-10-23). Unbounded is used only for the wordmark; everything else stays Urbanist.
- **Icons:** `public/favicon.svg` (follows the browser's light and dark mode), `favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` (the mark in #3B82F6 on a #0B1220 tile).
- **Header and footer:** span the window (padding up to 56px, capped at 2000px wide) so the logo and menu sit near the corners; page content stays centered.
- **Footer:** the Apple-independence disclaimer on the left; About, Contact, Privacy, Terms on the right. No guide links.
- **Pairing row:** "Your code" + input always visible. No explanatory VPN note on the homepage. `?debug=1` shows the network group for troubleshooting.
