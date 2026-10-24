import { useEffect, useState } from 'react';

import {
  getCachedPluginIssueTitle,
  loadPluginIssueTitle,
} from '@plugins/issueMetadata';
import type { PluginIssueGroup } from '@plugins/issueIndex';

type IssueTitleResults = Partial<Record<number, string | null>>;

type IssueTitleState = {
  groups: PluginIssueGroup[] | undefined;
  results: IssueTitleResults;
};

export function usePluginIssueTitles(
  groups: PluginIssueGroup[] | undefined,
): Readonly<Partial<Record<number, string | null>>> {
  const [state, setState] = useState<IssueTitleState>({
    groups: undefined,
    results: {},
  });

  const issueNumbers = [
    ...new Set((groups ?? []).flatMap(group => group.slice(1))),
  ];
  const currentResults: IssueTitleResults =
    state.groups === groups ? state.results : {};
  const titles: IssueTitleResults = {};
  for (const issueNumber of issueNumbers) {
    titles[issueNumber] =
      getCachedPluginIssueTitle(issueNumber) ?? currentResults[issueNumber];
  }

  useEffect(() => {
    let active = true;
    const effectIssueNumbers = [
      ...new Set((groups ?? []).flatMap(group => group.slice(1))),
    ];
    const uncachedIssueNumbers = effectIssueNumbers.filter(
      issueNumber => getCachedPluginIssueTitle(issueNumber) === undefined,
    );
    let cursor = 0;

    const loadNext = async () => {
      while (active && cursor < uncachedIssueNumbers.length) {
        const issueNumber = uncachedIssueNumbers[cursor++];
        let title: string | null;
        try {
          title = (await loadPluginIssueTitle(issueNumber)) ?? null;
        } catch {
          title = null;
        }

        if (active) {
          setState(current => {
            if (!active) {
              return current;
            }

            const results = current.groups === groups ? current.results : {};
            return {
              groups,
              results: { ...results, [issueNumber]: title },
            };
          });
        }
      }
    };

    const workerCount = Math.min(6, uncachedIssueNumbers.length);
    for (let worker = 0; worker < workerCount; worker++) {
      void loadNext();
    }

    return () => {
      active = false;
    };
  }, [groups]);

  return titles;
}
