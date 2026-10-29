import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPIC_KEYS } from './lib/topics';

const blog = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(90),
      description: z.string().min(80).max(175),
      topic: z.enum(TOPIC_KEYS),
      order: z.number().int().min(1),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image(),
      heroAlt: z.string().min(20),
      related: z.array(z.string()).min(2).max(4),
      draft: z.boolean().default(false),
      tested: z
        .object({
          devices: z.array(z.string()).min(1),
          network: z.string(),
          files: z.string(),
          date: z.coerce.date(),
        })
        .optional(),
      embedTool: z.boolean().default(false),
    }),
});

export const collections = { blog };
