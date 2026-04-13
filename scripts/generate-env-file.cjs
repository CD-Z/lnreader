const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const out = {};

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith('--')) {
      continue;
    }

    const eqIndex = token.indexOf('=');

    if (eqIndex !== -1) {
      out[token.slice(2, eqIndex)] = token.slice(eqIndex + 1);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }

  return out;
}

function formatUtcDate(date) {
  const pad = n => String(n).padStart(2, '0');

  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = String(date.getUTCFullYear()).slice(-2);

  let hours = date.getUTCHours();
  const minutes = pad(date.getUTCMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours %= 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm} UTC`;
}

function getGitHash() {
  return execSync('git rev-parse --short HEAD').toString().trim();
}

function getHiddenEnvFiles(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => {
      return (
        entry.isFile() &&
        /^\..*\.env$/.test(entry.name) &&
        entry.name !== '.env'
      );
    })
    .map(entry => path.join(rootDir, entry.name))
    .sort();
}

function readHiddenEnvFiles(rootDir) {
  const files = getHiddenEnvFiles(rootDir);

  const content = files
    .map(filePath => {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath, 'utf8').trimEnd();

      return `# Imported from ${fileName}\n${fileContent}`;
    })
    .join('\n\n');

  return { files, content };
}

const args = parseArgs(process.argv);
const projectRoot = path.join(__dirname, '..');

const buildType = args['build-type'] || 'Beta';
const myanimelistClientId = args['myanimelist-client-id'];
const anilistClientId = args['anilist-client-id'];

const gitHash = args['git-hash'] || getGitHash();
const releaseDate = args['release-date'] || formatUtcDate(new Date());
const nodeEnv =
  args['node-env'] ||
  (buildType.toLowerCase().includes('release') ? 'production' : 'development');

const generatedEnvContent = [
  `BUILD_TYPE=${JSON.stringify(buildType)}`,
  `GIT_HASH=${JSON.stringify(gitHash)}`,
  `RELEASE_DATE=${JSON.stringify(releaseDate)}`,
  `NODE_ENV=${JSON.stringify(nodeEnv)}`,
  `MYANIMELIST_CLIENT_ID=${JSON.stringify(myanimelistClientId)}`,
  `ANILIST_CLIENT_ID=${JSON.stringify(anilistClientId)}`,
  '',
].join('\n');

const { files: hiddenEnvFiles, content: hiddenEnvContent } =
  readHiddenEnvFiles(projectRoot);

const envContent = hiddenEnvContent
  ? `${generatedEnvContent}\n# Imported hidden env files\n${hiddenEnvContent}\n`
  : generatedEnvContent;

const envFilePath = path.join(projectRoot, '.env');
const buildInfoPath = path.join(
  projectRoot,
  'src',
  'generated',
  'build-info.ts',
);

const buildInfoContent = `// This file is generated. Do not edit manually.
export const BUILD_TYPE = ${JSON.stringify(buildType)};
export const GIT_HASH = ${JSON.stringify(gitHash)};
export const RELEASE_DATE = ${JSON.stringify(releaseDate)};
export const NODE_ENV = ${JSON.stringify(nodeEnv)};
export const MYANIMELIST_CLIENT_ID = ${JSON.stringify(myanimelistClientId)};
export const ANILIST_CLIENT_ID = ${JSON.stringify(anilistClientId)};

export default {
  BUILD_TYPE,
  GIT_HASH,
  RELEASE_DATE,
  NODE_ENV,
  MYANIMELIST_CLIENT_ID,
  ANILIST_CLIENT_ID,
};
`;

try {
  fs.mkdirSync(path.dirname(buildInfoPath), { recursive: true });
  fs.writeFileSync(buildInfoPath, buildInfoContent, 'utf8');
  fs.writeFileSync(envFilePath, envContent, 'utf8');

  console.log(`Generated .env for ${buildType} build`);

  if (hiddenEnvFiles.length > 0) {
    console.log(
      `Imported ${hiddenEnvFiles.length} hidden env file(s):`,
      hiddenEnvFiles.map(filePath => path.basename(filePath)),
    );
  }

  console.table({
    BUILD_TYPE: buildType,
    GIT_HASH: gitHash,
    RELEASE_DATE: releaseDate,
    NODE_ENV: nodeEnv,
  });
} catch (err) {
  console.error('Error: Could not write .env file:', err.message);
  process.exit(1);
}
