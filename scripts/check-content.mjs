// Runs before every build (npm "prebuild"). Fails the build, and so the deploy, when a published
// guide still has a TODO or screenshot placeholder in it, or links to a page of this site that
// does not exist. Drafts (draft: true) are skipped: they are allowed to be unfinished.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BLOG = 'content/blog';
const TOPICS = ['wifi-basics', 'routers-and-networks', 'phones-as-modems', 'local-transfer-tech', 'transfer-in-practice'];
const PAGES = ['about', 'contact', 'privacy', 'terms', 'editorial-policy'];

const posts = [];
for (const slug of readdirSync(BLOG)) {
  const file = join(BLOG, slug, 'index.md');
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const draft = /^draft:\s*true\s*$/m.test(text.split(/\n---\n/)[0]);
  posts.push({ slug, file, text, draft });
}
const live = new Set(posts.filter((post) => !post.draft).map((post) => post.slug));

const problems = [];
for (const post of posts.filter((p) => !p.draft)) {
  if (/\bTODO\b/.test(post.text)) problems.push(`${post.file}: contains a TODO`);
  if (/SCREENSHOT \d/.test(post.text)) problems.push(`${post.file}: contains a SCREENSHOT placeholder`);
  for (const [, target] of post.text.matchAll(/\]\((\/[^)\s#]*)/g)) {
    const path = target.split('?')[0];
    const parts = path.split('/').filter(Boolean);
    const ok =
      parts.length === 0 ||
      (parts.length === 1 && (PAGES.includes(parts[0]) || parts[0] === 'blog')) ||
      (parts[0] === 'blog' && parts[1] === 'topic' && TOPICS.includes(parts[2]) && parts.length === 3) ||
      (parts[0] === 'blog' && parts.length === 2 && live.has(parts[1])) ||
      existsSync(join('public', path));
    if (!ok) problems.push(`${post.file}: broken internal link ${target}`);
  }
  for (const slug of (post.text.match(/^related:\n((?:\s+- .+\n)+)/m)?.[1] ?? '').matchAll(/- "?([^"\n]+)"?/g)) {
    if (!live.has(slug[1])) problems.push(`${post.file}: related guide "${slug[1]}" is not a published guide`);
  }
}

if (problems.length) {
  console.error('Content check failed:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Content check passed: ${live.size} published guides, ${posts.length - live.size} draft(s).`);
