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
 * Google AdSense publisher ID, like 'ca-pub-1234567890123456'. Leave it empty until the AdSense
 * account exists: while it is empty the site has no ads, no AdSense tags and the policy pages say
 * so. Setting it switches on, in the same deploy, the verification meta tag on every page, the
 * ads on guide pages (never on the homepage or the transfer tool) and the matching wording in the
 * Privacy, Terms and Editorial policy pages. Bump LEGAL_UPDATED in the same commit.
 */
export const ADSENSE_PUBLISHER_ID = '';
export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_PUBLISHER_ID);

/**
 * Ad unit IDs (the `data-ad-slot` numbers) from AdSense > Ads > By ad unit, for the three places
 * inside a guide: after the introduction, at the midpoint and before "Keep reading". An empty
 * one is simply not shown, so Auto ads alone also work.
 */
export const ADSENSE_SLOTS = { top: '', middle: '', end: '' };

/** Shown on the Privacy and Terms pages. Change it whenever either page changes. */
export const LEGAL_UPDATED = 'October 23, 2026';
