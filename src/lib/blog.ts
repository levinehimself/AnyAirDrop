import { getCollection, type CollectionEntry } from 'astro:content';
import { TOPIC_KEYS, type TopicKey } from './topics';

export type Post = CollectionEntry<'blog'>;

/** Published posts only: drafts and posts dated in the future stay out of every page and the sitemap. */
export async function getPosts(): Promise<Post[]> {
  const now = Date.now();
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.publishDate.getTime() <= now);
  return posts.sort(
    (a, b) => TOPIC_KEYS.indexOf(a.data.topic) - TOPIC_KEYS.indexOf(b.data.topic) || a.data.order - b.data.order,
  );
}

export function postsInTopic(posts: Post[], topic: TopicKey): Post[] {
  return posts.filter((post) => post.data.topic === topic);
}

/** Whole minutes to read the post at an easy 220 words a minute, never less than one. */
export function readingMinutes(post: Post): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
