import { getCollection, type CollectionEntry } from 'astro:content'
import {
  getPackageByDir,
  groupedPackages,
  type PackageEntry,
  type PackageGroup,
} from '@/config/packages'

export interface DocPage {
  title: string
  /** Site-root-relative path WITHOUT the base prefix, e.g. `/docs/packages/config`. */
  path: string
  /** The route param (`slug`) used by the [...slug] route. */
  slug: string
  collection: 'packageReadmes' | 'packageDocs'
  entryId: string
}

export interface PackageNav {
  pkg: PackageEntry
  page: DocPage
  docs: DocPage[]
}

export interface GroupNav {
  group: PackageGroup
  packages: PackageNav[]
}

export interface NavModel {
  groups: GroupNav[]
  /** Flat, ordered list of every doc page (for prev/next). */
  flat: DocPage[]
}

/** Build a base-aware href from a site-root-relative path. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${path}`
}

function humanize(segment: string): string {
  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** `kaiseki-data/README` -> dir `kaiseki-data`. */
function dirFromReadmeId(id: string): string {
  return id.replace(/\/README$/i, '')
}

/** `kaiseki-data/docs/getting-started/quickstart` -> { dir, docPath }. */
function parseDocId(id: string): { dir: string; docPath: string } {
  const [dir, ...rest] = id.split('/')
  // rest[0] === 'docs'
  let segments = rest.slice(1)
  // Section landing files (`_index`) map to their containing directory.
  if (segments[segments.length - 1] === '_index') {
    segments = segments.slice(0, -1)
  }
  const docPath = segments.join('/') || 'docs'
  return { dir, docPath }
}

function readmePage(entry: CollectionEntry<'packageReadmes'>, pkg: PackageEntry): DocPage {
  return {
    title: entry.data.title ?? pkg.title,
    path: `/docs/packages/${pkg.slug}`,
    slug: pkg.slug,
    collection: 'packageReadmes',
    entryId: entry.id,
  }
}

function docPage(entry: CollectionEntry<'packageDocs'>, pkg: PackageEntry): DocPage {
  const { docPath } = parseDocId(entry.id)
  const lastSegment = docPath.split('/').pop() ?? docPath
  return {
    title: entry.data.title ?? humanize(lastSegment),
    path: `/docs/packages/${pkg.slug}/${docPath}`,
    slug: `${pkg.slug}/${docPath}`,
    collection: 'packageDocs',
    entryId: entry.id,
  }
}

function sortDocs(a: DocPage, b: DocPage): number {
  return a.path.localeCompare(b.path, undefined, { numeric: true })
}

let cached: NavModel | null = null

export async function getNavModel(): Promise<NavModel> {
  if (cached) return cached

  const readmeEntries = await getCollection('packageReadmes')
  const docEntries = await getCollection('packageDocs')

  const readmeByDir = new Map<string, CollectionEntry<'packageReadmes'>>()
  for (const entry of readmeEntries) {
    readmeByDir.set(dirFromReadmeId(entry.id), entry)
  }

  const docsByDir = new Map<string, CollectionEntry<'packageDocs'>[]>()
  for (const entry of docEntries) {
    const { dir } = parseDocId(entry.id)
    const list = docsByDir.get(dir) ?? []
    list.push(entry)
    docsByDir.set(dir, list)
  }

  const groups: GroupNav[] = []
  const flat: DocPage[] = []

  for (const { group, items } of groupedPackages()) {
    const packagesNav: PackageNav[] = []
    for (const pkg of items) {
      const readmeEntry = readmeByDir.get(pkg.dir)
      if (!readmeEntry) continue
      const page = readmePage(readmeEntry, pkg)
      const docs = (docsByDir.get(pkg.dir) ?? [])
        .map((entry) => docPage(entry, pkg))
        .sort(sortDocs)
      packagesNav.push({ pkg, page, docs })
      flat.push(page, ...docs)
    }
    if (packagesNav.length > 0) {
      groups.push({ group, packages: packagesNav })
    }
  }

  cached = { groups, flat }
  return cached
}

/** Resolve the previous/next doc pages relative to a given route slug. */
export function prevNext(model: NavModel, slug: string): { prev?: DocPage; next?: DocPage } {
  const index = model.flat.findIndex((p) => p.slug === slug)
  if (index === -1) return {}
  return {
    prev: index > 0 ? model.flat[index - 1] : undefined,
    next: index < model.flat.length - 1 ? model.flat[index + 1] : undefined,
  }
}

export { getPackageByDir }
