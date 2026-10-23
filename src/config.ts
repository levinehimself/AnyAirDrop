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

/** Shown on the Privacy and Terms pages. Change it whenever either page changes. */
export const LEGAL_UPDATED = 'October 23, 2026';
