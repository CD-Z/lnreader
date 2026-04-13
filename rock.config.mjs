// @ts-check
import { platformIOS } from '@rock-js/platform-ios';
import { platformAndroid } from '@rock-js/platform-android';
import { pluginMetro } from '@rock-js/plugin-metro';
import { providerGitHub } from '@rock-js/provider-github';
import { loadEnvFile } from 'node:process';

// Loads environment variables from the default .env file
loadEnvFile();

/** @type {import('rock').Config} */
export default {
  bundler: pluginMetro(),
  platforms: {
    ios: platformIOS(),
    android: platformAndroid(),
  },
  remoteCacheProvider: providerGitHub({
    repository: process.env.REPO_NAME || 'lnreader',
    owner: process.env.REPO_OWNER || 'lnreader',
    //@ts-expect-error
    token: process.env.GITHUB_TOKEN,
  }),
};
