import type { APIRoute, GetStaticPaths } from 'astro';
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID } from '../config';

// Serves /ads.txt with the exact line AdSense expects, and only once ads are switched on.
// While they are off, no file is produced at all.
export const getStaticPaths = (() => (ADS_ENABLED ? [{ params: { file: 'ads' } }] : [])) satisfies GetStaticPaths;

export const GET: APIRoute = () =>
  new Response(`google.com, ${ADSENSE_PUBLISHER_ID.replace('ca-pub-', 'pub-')}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
