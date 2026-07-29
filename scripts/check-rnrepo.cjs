const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const semver = require('semver');

// ── Config ──────────────────────────────────────────────────────────────────
const RNREPO_URL =
  'https://raw.githubusercontent.com/software-mansion/rnrepo/main/libraries.json';
const CACHE_DIR = path.join(__dirname, '..', 'node_modules', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'rnrepo-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

const RN_VERSION = '0.86.0';

// ── ANSI colors ─────────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ── CLI args ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { auto: false, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a === '--auto') args.auto = true;
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

// ── HTTP fetch ──────────────────────────────────────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'check-rnrepo/1.0' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`HTTP ${res.statusCode} fetching ${url}`),
          );
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

// ── rnrepo data (cached) ────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const cached = JSON.parse(raw);
    if (cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached.data;
    }
  } catch { }
  return null;
}

function writeCache(data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ fetchedAt: Date.now(), data }),
      'utf8',
    );
  } catch (e) {
    // Non-fatal — cache is a nicety
    console.error(`  ⚠  Cache write failed: ${e.message}`);
  }
}

async function getRnrepoData() {
  // Try cache first
  const cached = readCache();
  if (cached) return cached;

  // Fetch from network
  try {
    console.error('  Fetching rnrepo data…');
    const data = await fetchJson(RNREPO_URL);
    writeCache(data);
    return data;
  } catch (err) {
    // Fall back to stale cache
    try {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const cached = JSON.parse(raw);
      if (cached.data) {
        console.error(`  ⚠  Fetch failed (${err.message}); using stale cache.`);
        return cached.data;
      }
    } catch { }
    console.error(`  ✖  Failed to fetch rnrepo data: ${err.message}`);
    process.exit(1);
  }
}

// ── Platform entry helpers ──────────────────────────────────────────────────
function getPlatformVersions(lib) {
  // Prefer android entries; fall back to ios
  const platform = lib.android || lib.ios;
  return Array.isArray(platform) ? platform : [];
}

function rnVersionMatches(entry) {
  const rnv = entry.reactNativeVersion;
  if (rnv === undefined || rnv === null) return true;
  if (Array.isArray(rnv)) {
    return rnv.some((v) => semver.satisfies(RN_VERSION, v));
  }
  return semver.satisfies(RN_VERSION, rnv);
}

// Check if an installed version satisfies a versionMatcher (handles arrays)
function versionSatisfies(installed, vm) {
  if (Array.isArray(vm)) {
    return vm.some((v) => semver.satisfies(installed, v));
  }
  return semver.satisfies(installed, vm);
}

// Resolve the highest/pinned versionMatcher from a pattern.
// For arrays, pick the highest element (by semver minVersion sort).
// For single strings, return as-is.
function resolveHighestMatcher(vm) {
  if (Array.isArray(vm)) {
    const sorted = [...vm].sort((a, b) => {
      const ma = semver.minVersion(a);
      const mb = semver.minVersion(b);
      if (!ma && !mb) return 0;
      if (!ma) return -1;
      if (!mb) return 1;
      return semver.compare(ma, mb);
    });
    return sorted[sorted.length - 1];
  }
  return vm;
}

// Compare two versionMatchers by their resolved minimum semver.
// Returns negative if a < b, positive if a > b, 0 if equal.
function compareVersionMatchers(a, b) {
  const resolvedA = resolveHighestMatcher(a);
  const resolvedB = resolveHighestMatcher(b);
  const ma = semver.minVersion(resolvedA);
  const mb = semver.minVersion(resolvedB);
  if (!ma && !mb) return 0;
  if (!ma) return -1;
  if (!mb) return 1;
  return semver.compare(ma, mb);
}

// Extract a concrete target version from a versionMatcher
function getTargetVersion(vm) {
  let matcher;
  if (Array.isArray(vm)) {
    // Pick the highest element from the array
    // Sort semver ranges by their minVersion
    const sorted = [...vm].sort((a, b) => {
      const ma = semver.minVersion(a);
      const mb = semver.minVersion(b);
      if (!ma && !mb) return 0;
      if (!ma) return -1;
      if (!mb) return 1;
      return semver.compare(ma, mb);
    });
    matcher = sorted[sorted.length - 1];
  } else {
    matcher = vm;
  }

  if (matcher === '*') return null; // any version — no concrete target

  // Handle `<X.Y.Z` ranges: minVersion('<4.0.0') gives 0.0.0 (useless).
  // Instead compute (X-1).0.0 as the target (the highest compatible major).
  const ltMatch = typeof matcher === 'string' && matcher.match(/^<(\d+)\.(\d+)\.(\d+)$/);
  if (ltMatch) {
    const major = parseInt(ltMatch[1], 10);
    if (major >= 2) {
      // e.g. <4.0.0 → target 3.0.0
      return `${major - 1}.0.0`;
    }
    // major < 2 (like <1.0.0 or <0.x.x) — can't compute a meaningful target
    return null;
  }

  const minV = semver.minVersion(matcher);
  if (!minV) return null;
  return minV.version;
}

// ── Categorize a dependency ─────────────────────────────────────────────────
const CATEGORY_NOT_ON_RNREPO = 'not-on-rnrepo';
const CATEGORY_MATCHING = 'matching';
const CATEGORY_MINOR_PATCH = 'minor-patch';
const CATEGORY_MAJOR = 'major';

function categorizeDep(pkgName, versionStr, rnrepo) {
  // Strip leading ^ ~ >= from installed version
  const cleaned = versionStr.replace(/^[\^~>=]+/, '');
  const installed = semver.valid(cleaned);
  if (!installed) {
    // Pre-release or invalid version — cannot compare
    return { category: CATEGORY_NOT_ON_RNREPO, installed: cleaned, target: null };
  }

  const lib = rnrepo[pkgName];
  if (!lib) {
    return { category: CATEGORY_NOT_ON_RNREPO, installed, target: null };
  }

  // Collect entries whose reactNativeVersion matches our RN version
  const matchingEntries = getPlatformVersions(lib).filter(rnVersionMatches);

  if (matchingEntries.length === 0) {
    return { category: CATEGORY_NOT_ON_RNREPO, installed, target: null };
  }

  // If installed version satisfies ANY entry's versionMatcher, it's compatible.
  const isMatching = matchingEntries.some((e) => {
    return versionSatisfies(installed, e.versionMatcher);
  });

  if (isMatching) {
    return { category: CATEGORY_MATCHING, installed, target: null };
  }

  // Not matching any entry — determine target from the entry with the
  // highest resolved versionMatcher (the most current recommendation).
  const bestEntry = matchingEntries.reduce((best, entry) => {
    const cmp = compareVersionMatchers(entry.versionMatcher, best.versionMatcher);
    return cmp > 0 ? entry : best;
  });
  const target = getTargetVersion(bestEntry.versionMatcher);

  if (!target) {
    // No concrete target (e.g. versionMatcher is `<X` where minVersion is 0.0.0)
    // The installed version doesn't satisfy the matcher, but we can't recommend
    // a specific upgrade version — treat as not on rnrepo.
    return { category: CATEGORY_NOT_ON_RNREPO, installed, target: null };
  }

  if (target === '0.0.0') {
    // minVersion returned 0.0.0 for an unbounded low range (e.g. <4.0.0 before
    // our special handling caught it). No actionable upgrade target.
    return { category: CATEGORY_NOT_ON_RNREPO, installed, target: null };
  }

  const targetMajor = semver.major(target);

  const installedMajor = semver.major(installed);
  if (installedMajor === targetMajor) {
    return {
      category: CATEGORY_MINOR_PATCH,
      installed,
      target,
    };
  }

  return {
    category: CATEGORY_MAJOR,
    installed,
    target,
  };
}

// ── Display ─────────────────────────────────────────────────────────────────
function padRight(s, len) {
  const str = String(s);
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

function displayResults(results) {
  const categories = [
    {
      key: CATEGORY_MAJOR,
      label: 'Major',
      color: RED,
    },
    {
      key: CATEGORY_MINOR_PATCH,
      label: 'Minor/patch',
      color: YELLOW,
    },
    {
      key: CATEGORY_NOT_ON_RNREPO,
      label: 'Not on rnrepo',
      color: DIM,
    },
    {
      key: CATEGORY_MATCHING,
      label: 'Matching',
      color: GREEN,
    },
  ];

  const counts = {};
  for (const cat of categories) counts[cat.key] = 0;

  for (const cat of categories) {
    const items = results.filter((r) => r.category === cat.key);
    if (items.length === 0) continue;
    counts[cat.key] = items.length;

    console.log(`\n${cat.color}${BOLD}${cat.label}${RESET}${cat.color}:${RESET}`);
    for (const item of items) {
      const name = padRight(item.package, 44);
      const installed = padRight(item.installed, 14);
      const target = item.target ? `→  ${item.target}` : '—';
      console.log(`  ${name} ${installed} ${target}`);
    }
  }

  // Summary
  console.log(`\n${BOLD}Summary:${RESET}`);
  for (const cat of categories) {
    const c = counts[cat.key];
    if (c === 0) continue;
    console.log(`  ${cat.color}${c} ${cat.label}${RESET}`);
  }
}

// ── Interactive prompt ──────────────────────────────────────────────────────
async function promptUpdates(upgradable) {
  const accepted = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (const pkg of upgradable) {
    const answer = await new Promise((resolve) => {
      rl.question(
        `Update ${pkg.package} from ${pkg.installed} to ${pkg.target}? [y/N] `,
        resolve,
      );
    });
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      accepted.push(pkg);
    }
  }

  rl.close();
  return accepted;
}

// ── Apply changes ───────────────────────────────────────────────────────────
function applyChanges(packages, dryRun) {
  const pkgJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));

  for (const pkg of packages) {
    const oldVersion = pkgJson.dependencies[pkg.package];
    const newVersion = `^${pkg.target}`;
    console.log(`  ${pkg.package}: ${oldVersion} → ${newVersion}`);
    pkgJson.dependencies[pkg.package] = newVersion;
  }

  if (packages.length === 0) {
    console.log('  No changes to apply.');
    return;
  }

  if (dryRun) {
    console.log('  (dry-run — package.json not modified)');
    return;
  }

  // Write package.json with 2-space indentation
  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(pkgJson, null, 2) + '\n',
    'utf8',
  );
  console.log('  ✓ package.json updated');

  // Run pnpm install
  const { execSync } = require('child_process');
  console.log('  Running pnpm install…');
  try {
    execSync('pnpm install', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('  ✓ pnpm install complete');
  } catch (err) {
    console.error(`  ✖ pnpm install failed: ${err.message}`);
    process.exit(1);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  // 1. Fetch rnrepo data
  const rnrepo = await getRnrepoData();

  // 2. Read package.json
  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  } catch (err) {
    console.error(`✖  Failed to read package.json: ${err.message}`);
    process.exit(1);
  }

  const deps = pkgJson.dependencies || {};

  // 3. Categorize each dependency
  const results = [];
  for (const [pkgName, versionStr] of Object.entries(deps)) {
    const result = categorizeDep(pkgName, versionStr, rnrepo);
    result.package = pkgName;
    results.push(result);
  }

  // Sort results by category priority, then by package name
  const categoryOrder = [
    CATEGORY_MAJOR,
    CATEGORY_MINOR_PATCH,
    CATEGORY_NOT_ON_RNREPO,
    CATEGORY_MATCHING,
  ];
  results.sort((a, b) => {
    const aOrder = categoryOrder.indexOf(a.category);
    const bOrder = categoryOrder.indexOf(b.category);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.package.localeCompare(b.package);
  });

  // 4. Display
  displayResults(results);

  // 5. Interactive prompt for packages with a concrete target
  const upgradable = results.filter(
    (r) =>
      (r.category === CATEGORY_MAJOR || r.category === CATEGORY_MINOR_PATCH) &&
      r.target,
  );

  if (upgradable.length === 0) {
    console.log('\nAll packages are matching or not actionable.');
    return;
  }

  const acceptAll = args.auto;
  let accepted;

  if (acceptAll) {
    console.log(
      `\n${upgradable.length} package(s) can be updated (--auto mode).`,
    );
    accepted = upgradable;
  } else {
    console.log(
      `\n${upgradable.length} package(s) can be updated.`,
    );
    accepted = await promptUpdates(upgradable);
  }

  if (accepted.length === 0) {
    console.log('No updates accepted.');
    return;
  }

  // 6. Apply
  applyChanges(accepted, args.dryRun);
}

main().catch((err) => {
  console.error(`✖  Unexpected error: ${err.message}`);
  process.exit(1);
});
