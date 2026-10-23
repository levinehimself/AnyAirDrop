// Tells search engines that support IndexNow (Bing, Yandex, Seznam, Naver and others) that
// pages were added or changed, so they are crawled sooner. Run it after a deploy:
//
//   npm run indexnow                       every page in the sitemap
//   npm run indexnow -- https://anyairdrop.com/about/    only the pages you list
//
// The key is not a secret: IndexNow checks it by fetching the key file from the site, so
// the file in public/ must be live before this runs.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const HOST = 'anyairdrop.com';
const SITE = `https://${HOST}`;

const keyFile = readdirSync('public').find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) {
  console.error('No IndexNow key file found in public/ (a 32-character name ending in .txt).');
  process.exit(1);
}
const key = readFileSync(`public/${keyFile}`, 'utf8').trim();
if (`${key}.txt` !== keyFile) {
  console.error(`The key file ${keyFile} must contain exactly its own name without ".txt".`);
  process.exit(1);
}

function sitemapUrls() {
  if (!existsSync('dist/sitemap-0.xml')) return [];
  const xml = readFileSync('dist/sitemap-0.xml', 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const urls = process.argv.slice(2).length > 0 ? process.argv.slice(2) : sitemapUrls();
if (urls.length === 0) {
  console.error('No pages to submit. Run "npm run build" first, or pass the addresses to submit.');
  process.exit(1);
}
const outside = urls.filter((url) => !url.startsWith(`${SITE}/`));
if (outside.length > 0) {
  console.error(`These addresses are not on ${HOST}:\n${outside.join('\n')}`);
  process.exit(1);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList: urls }),
});

// 200 and 202 mean accepted. 403 means the key file could not be verified, 422 a bad address.
console.log(`${response.status} ${response.statusText}: submitted ${urls.length} page${urls.length === 1 ? '' : 's'}`);
for (const url of urls) console.log(`  ${url}`);
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
