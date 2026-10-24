// Site-wide settings used by more than one page.

/**
 * The public contact address. It must exist as a mailbox or forwarder in cPanel
 * (Email Accounts or Forwarders), otherwise messages sent to it bounce.
 */
export const CONTACT_EMAIL = 'hello@anyairdrop.com';

export const GITHUB_URL = 'https://github.com/levinehimself/AnyAirDrop';

/** The person behind the site: shown on the About and Contact pages and in structured data. */
export const FOUNDER = {
  name: 'Amir Mohammad Zare',
  title: 'Founder',
  linkedin: 'https://www.linkedin.com/in/amir-mohammad-zare-35b631210',
  skills: ['Full-stack development', 'React', 'Node.js', 'Product strategy'],
};

/**
 * Other projects by the same person. They are linked as ordinary links (no nofollow), so
 * they also count as references to those sites.
 */
export const PROJECTS = [
  {
    name: 'WiserWork',
    url: 'https://wiserwork.org/',
    summary: 'More than 420 free online tools (converters, calculators, generators and file utilities) that run in your browser.',
  },
  {
    name: 'Explore City Guides',
    url: 'https://explorecityguides.com/',
    summary: 'Plain guides to cities and their public transport: fares, lines, stations and how to get around.',
  },
  {
    name: 'Levine Tech Talks',
    url: 'https://levine-tech-talks.com/',
    summary: 'A tech blog and YouTube channel with practical guides and fixes, plus articles on software, cybersecurity and AI.',
  },
];

/** "A", "A and B" or "A, B and C": the separator that goes after item i of n. */
export function listSeparator(i: number, n: number): string {
  if (i === n - 1) return '.';
  return i === n - 2 ? ' and ' : ', ';
}

/**
 * Go-live switch for Google AdSense. Leave both values empty until the AdSense account exists:
 * the site then has no ads, no AdSense tags, no ads.txt, and the policy pages say so.
 *
 * To go live, set both in one commit:
 *   ADSENSE_PUBLISHER_ID  the publisher ID, like 'ca-pub-1234567890123456'
 *   ADS_LIVE_SINCE        today's date as 'YYYY-MM-DD' (shown as "Last updated" on the policy pages)
 * The next deploy then switches on together: the verification meta tag on every page, the ads on
 * guide pages (never the homepage, never a page with the transfer tool), /ads.txt, and the matching
 * wording in the Privacy, Terms and Editorial policy pages. If one of the two values is missing or
 * malformed the build fails on purpose, so a half-configured site never reaches the live server.
 */
export const ADSENSE_PUBLISHER_ID = '';
export const ADS_LIVE_SINCE = '';
export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_PUBLISHER_ID);

if (ADSENSE_PUBLISHER_ID && !ADS_ENABLED) {
  throw new Error(`ADSENSE_PUBLISHER_ID must look like 'ca-pub-1234567890123456', got '${ADSENSE_PUBLISHER_ID}'.`);
}
if (ADS_ENABLED && (!/^\d{4}-\d{2}-\d{2}$/.test(ADS_LIVE_SINCE) || Number.isNaN(Date.parse(ADS_LIVE_SINCE)))) {
  throw new Error(`Set ADS_LIVE_SINCE to the go-live date as 'YYYY-MM-DD' in src/config.ts, got '${ADS_LIVE_SINCE}'.`);
}

/**
 * Ad unit IDs (the `data-ad-slot` numbers) from AdSense > Ads > By ad unit, for the three places
 * inside a guide: after the introduction, at the midpoint and before "Keep reading". An empty
 * one is simply not shown, so Auto ads alone also work.
 */
export const ADSENSE_SLOTS = { top: '', middle: '', end: '' };

/**
 * Shown on the Privacy and Terms pages. Once ads are live it follows ADS_LIVE_SINCE; if those pages
 * change again later, update ADS_LIVE_SINCE to that day.
 */
export const LEGAL_UPDATED = ADS_ENABLED
  ? new Date(`${ADS_LIVE_SINCE}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  : 'October 23, 2026';
