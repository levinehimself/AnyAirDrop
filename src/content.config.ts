import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPIC_KEYS } from './lib/topics';

const blog = defineCollection({
  // Only folders with an index.md. Older drafts written as index.mdx are left out until they are ready.
  loader: glob({ pattern: '*/index.md', base: './content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(90),
      /** Shown in search results; aim for 120 to 160 characters. */
      description: z.string().min(80).max(175),
      topic: z.enum(TOPIC_KEYS),
      /** Order inside its topic page, 1 first. */
      order: z.number().int().min(1),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image(),
      heroAlt: z.string().min(20),
      /** Slugs of two to four closely related posts, shown at the end. */
      related: z.array(z.string()).min(2).max(4),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
