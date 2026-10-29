
export const CONTACT_EMAIL = 'hello@anyairdrop.com';

export const GITHUB_URL = 'https://github.com/levinehimself/AnyAirDrop';

export const FOUNDER = {
  name: 'Amir Mohammad Zare',
  title: 'Founder',
  linkedin: 'https://www.linkedin.com/in/amir-mohammad-zare-35b631210',
  skills: ['Full-stack development', 'React', 'Node.js', 'Product strategy'],
};

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

export function listSeparator(i: number, n: number): string {
  if (i === n - 1) return '.';
  return i === n - 2 ? ' and ' : ', ';
}

export const ADSENSE_PUBLISHER_ID = '';
export const ADS_LIVE_SINCE = '';
export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_PUBLISHER_ID);

if (ADSENSE_PUBLISHER_ID && !ADS_ENABLED) {
  throw new Error(`ADSENSE_PUBLISHER_ID must look like 'ca-pub-1234567890123456', got '${ADSENSE_PUBLISHER_ID}'.`);
}
if (ADS_ENABLED && (!/^\d{4}-\d{2}-\d{2}$/.test(ADS_LIVE_SINCE) || Number.isNaN(Date.parse(ADS_LIVE_SINCE)))) {
  throw new Error(`Set ADS_LIVE_SINCE to the go-live date as 'YYYY-MM-DD' in src/config.ts, got '${ADS_LIVE_SINCE}'.`);
}

export const ADSENSE_SLOTS = { top: '', middle: '', end: '' };

export const LEGAL_UPDATED = ADS_ENABLED
  ? new Date(`${ADS_LIVE_SINCE}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  : 'October 23, 2026';
