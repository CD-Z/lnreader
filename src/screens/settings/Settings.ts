import GeneralSettings from './settingsGroups/generalSettingsGroup';
import AppearanceSettings from './settingsGroups/appearanceSettingsGroup';
import ReaderSettings from './settingsGroups/readerSettingsGroup';
import RepoSettings from './settingsGroups/repoSettingsGroup';
import type { Settings } from './Settings.d';
import TrackerSettings from './settingsGroups/trackerSettingsGroup';
import {
  defaultSettings as de,
  DefaultSettings,
} from './constants/defaultValues';

const settings: Settings = {
  general: GeneralSettings,
  appearance: AppearanceSettings,
  reader: ReaderSettings,
  repo: RepoSettings,
  tracker: TrackerSettings,
} as const;
export default settings;

export const defaultSettings: DefaultSettings = de;
