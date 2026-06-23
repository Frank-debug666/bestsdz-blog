import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /

Sitemap: https://bestsdz.xyz/sitemap.xml
Sitemap: https://bestsdz.xyz/sitemap.txt
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
