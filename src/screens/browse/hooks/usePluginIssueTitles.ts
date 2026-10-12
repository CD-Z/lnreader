import { useEffect, useState } from 'react';

import { loadPluginIssueTitle } from '@plugins/issueMetadata';
import type { PluginIssueGroup } from '@plugins/issueIndex';

export function usePluginIssueTitles(
  groups: PluginIssueGroup[] | undefined,
): Readonly<Partial<Record<number, string>>> {
  const [titles, setTitles] = useState<Partial<Record<number, string>>>({});

  useEffect(() => {
    let active = true;

    const issueNumbers = [
      ...new Set((groups ?? []).flatMap(group => group.slice(1))),
    ];
    let cursor = 0;

    const loadNext = async () => {
      while (active && cursor < issueNumbers.length) {
        const issueNumber = issueNumbers[cursor++];
        try {
          const title = await loadPluginIssueTitle(issueNumber);
          if (active && title !== undefined) {
            setTitles(current => ({ ...current, [issueNumber]: title }));
          }
        } catch {
          // A failed title leaves its issue-number link usable.
        }
      }
    };

    const workerCount = Math.min(3, issueNumbers.length);
    for (let worker = 0; worker < workerCount; worker++) {
      void loadNext();
    }

    return () => {
      active = false;
    };
  }, [groups]);

  return titles;
}
