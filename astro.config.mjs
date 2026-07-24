// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// TODO: set `site` to the production domain once one is registered —
	// needed for absolute canonical/OG URLs and the sitemap.

	// `output` stays static: every page is prerendered at build time. The
	// adapter exists for the single route that opts out via
	// `export const prerender = false` — src/pages/api/contact.ts.
	adapter: vercel(),
	vite: {
		plugins: [tailwindcss()],
	},
});
