# kaiseki-site

The documentation site for the [`kaiseki`](https://github.com/kaisekidev) suite of Composer
packages. It is built with [Astro](https://astro.build) and reproduces the design of the original
`kaiseki.dev` (Tailwind UI "Syntax" template) — dark mode, the red Kaiseki branding, sidebar
navigation, on-this-page table of contents, and Pagefind search.

Content is **compiled from each package's `README.md` and `docs/` folder** at build time. The set of
packages, their grouping, titles and order are controlled by a single configurable manifest:
[`packages.config.json`](./packages.config.json).

## How it works

```
../kaiseki-<name>/README.md      ─┐
../kaiseki-<name>/docs/**/*.md    ─┤→ Astro content collections → /docs/packages/<slug>/…
packages.config.json (manifest)  ─┘
```

- The kaiseki package repos live **next to** this directory (`../kaiseki-*`).
- `packages.config.json` lists which packages to include, in which group, with what title/slug.
  It is the **source of truth** for the sidebar and the pages that get generated.
- `src/content.config.ts` builds Astro glob collections from that manifest:
  - `packageReadmes` → `<dir>/README.md` → `/docs/packages/<slug>`
  - `packageDocs` → `<dir>/docs/**/*.md` → `/docs/packages/<slug>/<path>`
- `src/lib/docs.ts` maps entries to URLs and builds the navigation tree + prev/next order.

## Configuring which packages are shown

Edit [`packages.config.json`](./packages.config.json). Each entry:

```jsonc
{
  "dir": "kaiseki-container-builder", // sibling directory name
  "slug": "container-builder",         // URL: /docs/packages/container-builder
  "title": "kaiseki/container-builder",// sidebar + page title
  "description": "…",                  // meta description
  "repo": "kaiseki-container-builder", // GitHub repo under the org (for CI cloning)
  "group": "foundation",               // one of the ids in "groups"
  "hasDocs": false,                     // true if the repo ships a docs/ folder
  "hidden": false,                      // hide without deleting the entry
  "order": null                         // optional manual sort within the group
}
```

Groups (and their order/titles) are defined in the `groups` array at the top of the file.

To **re-seed** the manifest from the sibling checkouts (adds new packages, preserves your
overrides):

```bash
pnpm gen:packages
```

## Local development

The package repos must be available as siblings (`../kaiseki-*`). In this workspace they already
are. To fetch any that are missing from GitHub:

```bash
node scripts/clone-packages.mjs          # clone missing repos as siblings
UPDATE_EXISTING=1 node scripts/clone-packages.mjs  # also `git pull` existing ones
```

Then (this project uses **pnpm**; requires Node ≥ 22.12 for Astro 6):

```bash
pnpm install
pnpm dev        # http://localhost:4321/kaiseki-site
pnpm build      # static output in dist/ (also builds the Pagefind index)
pnpm preview
```

> Search is powered by Pagefind, which indexes the **built** site. It works in `pnpm build` /
> `pnpm preview` and on the deployed site; in `pnpm dev` the index may be empty.

## Deployment & rebuild-on-update

- **Hosting:** static output deployed to **GitHub Pages** via
  [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The workflow checks out this
  repo, clones the configured package repos as siblings, builds, and deploys. `SITE`/`BASE` are
  taken from `actions/configure-pages`, so the project base path (`/kaiseki-site`) is handled
  automatically.
- **Rebuild on each package update:** the deploy workflow listens for a `repository_dispatch` event
  of type `package-updated`. Each package repo sends that event on push to its default branch using
  [`templates/notify-site.yml`](./templates/notify-site.yml). Copy that file into every package's
  `.github/workflows/` and add a `SITE_DISPATCH_TOKEN` secret (see the comments in the template).

If you'd rather not touch every package repo, replace the `repository_dispatch` trigger with a
`schedule:` (cron) in `deploy.yml` for periodic rebuilds.

## Project layout

```
packages.config.json          # configurable manifest of packages
scripts/
  generate-packages-config.mjs# (re)seed the manifest from sibling dirs
  clone-packages.mjs          # clone/update package repos as siblings (CI + setup)
src/
  config/packages.ts          # typed accessors over the manifest
  content.config.ts           # Astro glob collections (README + docs/)
  lib/docs.ts                  # entry → URL mapping, nav tree, prev/next
  components/                  # ported Syntax design (Header, Hero, Navigation, …)
  layouts/                     # BaseLayout, DocsLayout
  pages/
    index.astro               # home (Hero + getting started)
    docs/packages/[...slug].astro  # every package + docs page
templates/notify-site.yml     # snippet packages add to trigger rebuilds
.github/workflows/deploy.yml  # build + deploy to GitHub Pages
```
