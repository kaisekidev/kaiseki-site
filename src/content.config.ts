import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { packages } from './config/packages'

// The kaiseki-* package checkouts live one directory above the site root.
// Each visible package contributes its README.md (overview page) and, if present,
// every markdown file under its docs/ folder.
const base = '..'

const readmePatterns = packages.map((p) => `${p.dir}/README.md`)
const docsPatterns = packages
  .filter((p) => p.hasDocs)
  .map((p) => `${p.dir}/docs/**/*.{md,mdx}`)

// Loose schema: package markdown is authored as plain GitHub-flavoured markdown and
// may carry arbitrary front-matter (or none at all).
const docSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough()

const packageReadmes = defineCollection({
  loader: glob({ base, pattern: readmePatterns }),
  schema: docSchema,
})

const packageDocs = defineCollection({
  // Fall back to a pattern that matches nothing if no package ships docs/.
  loader: glob({ base, pattern: docsPatterns.length ? docsPatterns : ['__no_docs__/**'] }),
  schema: docSchema,
})

export const collections = {
  packageReadmes,
  packageDocs,
}
