import rawConfig from '../../packages.config.json'

export interface PackageGroup {
  id: string
  title: string
}

export interface PackageEntry {
  /** Directory name of the package checkout (e.g. `kaiseki-container-builder`). */
  dir: string
  /** URL slug under /docs/packages/ (e.g. `container-builder`). */
  slug: string
  /** Display title (e.g. `kaiseki/container-builder`). */
  title: string
  description: string
  /** GitHub repo name under the org. */
  repo: string
  /** Group id this package belongs to. */
  group: string
  /** Whether the package ships a docs/ folder. */
  hasDocs: boolean
  /** Hide from the site without removing the entry. */
  hidden: boolean
  /** Optional manual sort order within a group (lower first). */
  order: number | null
}

export interface PackagesConfig {
  org: string
  groups: PackageGroup[]
  packages: PackageEntry[]
}

const config = rawConfig as PackagesConfig

export const org = config.org
export const groups = config.groups

/** All visible packages, in config order. */
export const packages: PackageEntry[] = config.packages.filter((p) => !p.hidden)

/** The directories the build should read content from (visible packages only). */
export const packageDirs = packages.map((p) => p.dir)

export function getPackageByDir(dir: string): PackageEntry | undefined {
  return packages.find((p) => p.dir === dir)
}

export function getPackageBySlug(slug: string): PackageEntry | undefined {
  return packages.find((p) => p.slug === slug)
}

/** Packages grouped and ordered for the sidebar navigation. */
export function groupedPackages(): Array<{ group: PackageGroup; items: PackageEntry[] }> {
  return groups
    .map((group) => ({
      group,
      items: packages
        .filter((p) => p.group === group.id)
        .sort((a, b) => {
          const ao = a.order ?? Number.MAX_SAFE_INTEGER
          const bo = b.order ?? Number.MAX_SAFE_INTEGER
          if (ao !== bo) return ao - bo
          return a.title.localeCompare(b.title)
        }),
    }))
    .filter((g) => g.items.length > 0)
}
