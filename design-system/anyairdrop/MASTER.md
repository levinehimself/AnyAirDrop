# AnyAirDrop.com design system: Quiet Radar

Source of truth for every page. Chosen 2026-10-21 from the Design 6 canvas:
https://claude.ai/artifact/D2q129uHdJqK32VYGec8at

Page-specific overrides go in `design-system/anyairdrop/pages/<page>.md` and win over this file.

Built with UI UX Pro Max guidance: style "Minimalism & Swiss Style", landing pattern
"Minimal Single Column", density spacious, motion subtle.

## Principles

1. **The tool is the page.** The homepage holds the header, one headline, one line of copy, the radar, three benefit lines and a footer. Nothing else.
2. **One accent.** Blue marks only "You", primary buttons, links and the selected device.
3. **Thin, quiet, flat.** 1px hairlines, no shadows, no gradients, no cards on the homepage.
4. **Explain elsewhere.** FAQs, feature grids, how-it-works and comparisons live on guide pages, linked from the footer.

## Tokens

```css
:root {
  /* Color */
  --color-bg: #F8FAFC;          /* page */
  --color-surface: #FFFFFF;     /* device circles, sheets, secondary buttons */
  --color-text: #0F172A;        /* headings, body */
  --color-text-muted: #475569;  /* secondary text, nav, footer (7.2:1 on bg) */
  --color-line: #E2E8F0;        /* radar rings, dividers, button borders */
  --color-line-strong: #CBD5E1; /* idle device ring */
  --color-accent: #2563EB;      /* You, primary button, links, selected device */
  --color-accent-hover: #1D4ED8;
  --color-on-accent: #FFFFFF;   /* 5.2:1 on accent */
  --color-success: #15803D;     /* sent check only */
  --color-scrim: rgba(15, 23, 42, 0.25); /* behind phone bottom sheet */

  /* Type */
  --font-sans: "Inter", system-ui, sans-serif;
  --text-h1: 600 44px/1.12 var(--font-sans);   /* 34px under 720px, 28px in phone layout */
  --text-lead: 400 18px/1.6 var(--font-sans);
  --text-ui: 500 15px/1.4 var(--font-sans);
  --text-label: 600 14px/1.3 var(--font-sans);
  --text-small: 400 13px/1.5 var(--font-sans);
  --tracking-h1: -0.03em;

  /* Space (8px rhythm) */
  --space-1: 8px;  --space-2: 12px; --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 40px; --space-7: 48px; --space-8: 64px;
  --container: 1120px;

  /* Shape */
  --radius-button: 10px;  /* 12px in phone layout */
  --radius-sheet: 20px;   /* top corners of the phone bottom sheet */

  /* Motion */
  --dur-color: 200ms;     /* hover/focus color changes */
  --dur-enter: 350ms;     /* device appears, sheet slides up (300ms) */
  --pulse: 3.2s;          /* one radar pulse loop */
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
| Footer | Guide links left, Privacy and Terms right, trademark line full width in 13px muted: "AirDrop is a trademark of Apple Inc. AnyAirDrop.com is not affiliated with Apple." |
| Phone bottom sheet | Selecting a device opens a white sheet from the bottom over a 25% scrim: 36x4px handle, title, file summary, Cancel / Send. The same sheet shows progress, then "Sent" with Done |

## Rules

- Write the brand exactly "AnyAirDrop" / "AnyAirDrop.com" in visible text. URLs stay lowercase.
- Use "AirDrop" only referentially ("works like AirDrop", "AirDrop to Android"), never as part of our name, and never Apple's AirDrop icon.
- Text contrast at least 4.5:1. Focus ring: 2px accent outline, 3px offset, on every button and link.
- Touch targets at least 44x44px, 8px apart.
- Respect `prefers-reduced-motion`: no pulse, no fade, final states shown at once.
- Line icons only (Lucide-style, stroke 1.6), never emoji.
- No ads, pop-ups or cookie banners on the homepage.

## Avoid

Cards and feature grids on the homepage, more than one accent color, shadows, gradients, big illustrations, stock photos, carousels, FAQ blocks above the footer, more than two header links.
