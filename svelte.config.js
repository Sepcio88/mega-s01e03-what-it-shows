import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

// Build frame for the export: .svx pages through mdsvex, every page in the runbook layout.
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({ extensions: ['.svx'], layout: { runbook } }),
  ],
  kit: {
    adapter: adapter({ fallback: undefined }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb'] },
  },
};
