import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import pagefind from 'astro-pagefind'
import tailwindcss from '@tailwindcss/vite'
import { unified } from '@astrojs/markdown-remark'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// The public URL the site is deployed under. For GitHub Pages project sites this
// is https://<org>.github.io/<repo>. Override via SITE / BASE env vars in CI.
const site = process.env.SITE ?? 'https://kaisekidev.github.io'
const base = process.env.BASE ?? '/kaiseki-site'

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
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
    }),
  },
})
