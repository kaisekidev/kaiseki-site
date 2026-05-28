#!/usr/bin/env node
/**
 * Seed / refresh packages.config.json by scanning the sibling kaiseki-* package
 * checkouts. The generated file is the SOURCE OF TRUTH for what the site builds —
 * it is meant to be hand-edited afterwards (reorder, regroup, drop packages,
 * tweak titles). Re-running this script preserves existing per-package overrides
 * (group, title, order, hidden) and only adds packages it doesn't know about yet.
 *
 * Usage: node scripts/generate-packages-config.mjs
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..')
// Where the kaiseki-* package repos live, relative to the site root.
const packagesRoot = path.resolve(siteRoot, process.env.KAISEKI_PACKAGES_DIR ?? '..')
const configPath = path.join(siteRoot, 'packages.config.json')

const ORG = 'kaisekidev'

const GROUPS = [
  { id: 'foundation', title: 'Foundation' },
  { id: 'wordpress-core', title: 'WordPress Core' },
  { id: 'wordpress', title: 'WordPress Utilities' },
  { id: 'integrations', title: 'Plugin Integrations' },
  { id: 'tooling', title: 'Tooling' },
]

const FOUNDATION = new Set([
  'config',
  'container-builder',
  'nested-array',
  'string-filter',
  'data',
  'laravel-helper-mocks',
])
const WP_CORE = new Set([
  'wp-hook',
  'wp-config',
  'wp-context',
  'wp-env',
  'wp-cron',
  'wp-block-editor',
  'wp-rest-api',
  'wp-meta',
  'wp-cli-util',
])
// Dirs to never include (no publishable composer package / fixtures).
const EXCLUDE = new Set(['kaiseki-test-pkg'])

function groupFor(slug) {
  if (slug.startsWith('scaffold-')) return 'tooling'
  if (slug.startsWith('wp-plugin-')) return 'integrations'
  if (FOUNDATION.has(slug)) return 'foundation'
  if (WP_CORE.has(slug)) return 'wordpress-core'
  return 'wordpress'
}

async function readJson(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'))
  } catch {
    return null
  }
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  const entries = await fs.readdir(packagesRoot, { withFileTypes: true })
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('kaiseki-') && !EXCLUDE.has(e.name))
    .map((e) => e.name)
    .sort()

  const existing = (await readJson(configPath)) ?? { org: ORG, groups: GROUPS, packages: [] }
  const overrides = new Map((existing.packages ?? []).map((p) => [p.dir, p]))

  const packages = []
  for (const dir of dirs) {
    const composer = await readJson(path.join(packagesRoot, dir, 'composer.json'))
    const hasReadme = await exists(path.join(packagesRoot, dir, 'README.md'))
    if (!hasReadme) continue
    // kaiseki packages are published as kaiseki/<slug>; fall back to the dir name.
    const composerName = composer?.name ?? ''
    const isKaiseki = composerName.startsWith('kaiseki/')
    const slug = dir.replace(/^kaiseki-/, '')
    const title = isKaiseki ? composerName : `kaiseki/${slug}`
    const hasDocs = await exists(path.join(packagesRoot, dir, 'docs'))
    const prev = overrides.get(dir) ?? {}

    packages.push({
      dir,
      slug: prev.slug ?? slug,
      title: prev.title ?? title,
      description: prev.description ?? composer?.description ?? '',
      repo: prev.repo ?? dir,
      group: prev.group ?? groupFor(slug),
      hasDocs,
      hidden: prev.hidden ?? false,
      order: prev.order ?? null,
    })
  }

  const config = {
    org: existing.org ?? ORG,
    groups: existing.groups ?? GROUPS,
    packages,
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
  console.log(`Wrote ${packages.length} packages to ${path.relative(siteRoot, configPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
