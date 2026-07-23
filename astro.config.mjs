// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// TODO: set `site` to the production domain once one is registered —
	// needed for absolute canonical/OG URLs and the sitemap.
	vite: {
		plugins: [tailwindcss()],
	},
});
