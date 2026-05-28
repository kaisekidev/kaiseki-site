#!/usr/bin/env node
/**
 * Clone (or update) every configured kaiseki package repository as a SIBLING of
 * the site directory, so the Astro content loaders can read each package's
 * README.md and docs/ folder from `../<dir>`.
 *
 * Used by CI (where the package repos are not present) and for first-time local
 * setup. Repos that already exist as siblings are left untouched unless
 * UPDATE_EXISTING=1, in which case a shallow `git pull` is attempted.
 *
 * Env:
 *   KAISEKI_PACKAGES_DIR  where siblings live (default: site root's parent)
 *   UPDATE_EXISTING=1     git pull repos that are already checked out
 *   PACKAGE_BRANCH        branch to clone (default: the repo default branch)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..')
const packagesRoot = path.resolve(siteRoot, process.env.KAISEKI_PACKAGES_DIR ?? '..')

const config = JSON.parse(readFileSync(path.join(siteRoot, 'packages.config.json'), 'utf8'))
const org = config.org
const branch = process.env.PACKAGE_BRANCH
const updateExisting = process.env.UPDATE_EXISTING === '1'

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

let cloned = 0
let updated = 0
let skipped = 0

for (const pkg of config.packages) {
  if (pkg.hidden) continue
  const dest = path.join(packagesRoot, pkg.dir)
  const repoUrl = `https://github.com/${org}/${pkg.repo}.git`

  if (existsSync(dest)) {
    if (updateExisting) {
      console.log(`↻ Updating ${pkg.dir}`)
      try {
        run('git', ['-C', dest, 'pull', '--ff-only'], packagesRoot)
        updated++
      } catch {
        console.warn(`  (skipped update for ${pkg.dir})`)
      }
    } else {
      skipped++
    }
    continue
  }

  console.log(`⬇ Cloning ${org}/${pkg.repo}`)
  const args = ['clone', '--depth', '1']
  if (branch) args.push('--branch', branch)
  args.push(repoUrl, dest)
  run('git', args, packagesRoot)
  cloned++
}

console.log(`\nDone. cloned=${cloned} updated=${updated} skipped(existing)=${skipped}`)
