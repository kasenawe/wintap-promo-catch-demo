import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message)
  }
}

const indexHtml = read('index.html')
assert(
  /name=["']robots["'][^>]*content=["']noindex,\s*nofollow,\s*noarchive,\s*nosnippet["']/.test(
    indexHtml,
  ) ||
    /content=["']noindex,\s*nofollow,\s*noarchive,\s*nosnippet["'][^>]*name=["']robots["']/.test(
      indexHtml,
    ),
  'index.html must include robots noindex, nofollow, noarchive, nosnippet',
)

const robots = read('public/robots.txt')
assert(/User-agent:\s*\*/i.test(robots), 'robots.txt must include User-agent: *')
assert(/Disallow:\s*\//i.test(robots), 'robots.txt must disallow the whole site')
assert(!/^\s*Allow:\s*\//im.test(robots), 'robots.txt must not allow the whole site')

assert(!existsSync(join(root, 'sitemap.xml')), 'source sitemap.xml must not exist')
assert(
  !existsSync(join(root, 'public/sitemap.xml')),
  'public/sitemap.xml must not exist',
)

const vercel = JSON.parse(read('vercel.json'))
const robotsHeader = vercel.headers
  ?.flatMap((entry) => entry.headers ?? [])
  ?.find((header) => header.key === 'X-Robots-Tag')

assert(Boolean(robotsHeader), 'vercel.json must set X-Robots-Tag')
assert(
  robotsHeader?.value === 'noindex, nofollow, noarchive, nosnippet',
  'vercel.json X-Robots-Tag must be noindex, nofollow, noarchive, nosnippet',
)

if (existsSync(join(root, 'dist/index.html'))) {
  const distHtml = read('dist/index.html')
  assert(
    distHtml.includes('noindex') &&
      distHtml.includes('nofollow') &&
      distHtml.includes('noarchive') &&
      distHtml.includes('nosnippet'),
    'dist/index.html must preserve robots noindex metadata',
  )
}

if (existsSync(join(root, 'dist/robots.txt'))) {
  const distRobots = read('dist/robots.txt')
  assert(/Disallow:\s*\//i.test(distRobots), 'dist/robots.txt must block the site')
}

if (failures.length > 0) {
  console.error('Privacy checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Privacy checks passed (${7 + (existsSync(join(root, 'dist/index.html')) ? 1 : 0) + (existsSync(join(root, 'dist/robots.txt')) ? 1 : 0)} assertions).`)
