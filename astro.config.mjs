// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.potockaksiegowosc.pl',

	// `output` stays static: every page is prerendered at build time. The
	// adapter exists for the single route that opts out via
	// `export const prerender = false` — src/pages/api/contact.ts.
	adapter: vercel(),
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
