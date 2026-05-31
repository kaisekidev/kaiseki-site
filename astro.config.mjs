import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import pagefind from 'astro-pagefind'
import tailwindcss from '@tailwindcss/vite'
import { unified } from '@astrojs/markdown-remark'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// Package markdown (READMEs especially) opens with an h1 that repeats the page
// title we already render in DocsHeader. Drop the first top-level h1 so it isn't
// shown twice; the <header> title stays.
function rehypeStripLeadingH1() {
  return (tree) => {
    const i = tree.children.findIndex((n) => n.type === 'element' && n.tagName === 'h1')
    if (i !== -1) tree.children.splice(i, 1)
  }
}

// The public URL the site is deployed under. We serve from the apex custom
// domain kaiseki.dev, so the site lives at the root (base '/'). In CI the
// configure-pages step overrides SITE / BASE from the Pages custom-domain
// setting; these defaults keep local builds and any fallback in sync.
const site = process.env.SITE ?? 'https://kaiseki.dev'
const base = process.env.BASE ?? '/'

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap(), pagefind()],
  // Tailwind v4 is wired through its Vite plugin (no @astrojs/tailwind / PostCSS).
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Reuse the Syntax template's Prism token CSS (src/styles/prism.css).
    syntaxHighlight: 'prism',
    // Astro 6: remark/rehype plugins are configured on the processor.
    processor: unified({
      rehypePlugins: [rehypeStripLeadingH1, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
    }),
  },
})
