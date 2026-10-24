import * as cheerio from 'cheerio';
import { fetchTimeout } from '@utils/fetch/fetch';

const issueTitles = new Map<number, string>();
const inFlightTitles = new Map<number, Promise<string | undefined>>();

export function getPluginIssueUrl(issueNumber: number): string {
  return `https://github.com/LNReader/lnreader-plugins/issues/${issueNumber}`;
}

function normalizeTitle(value: string | undefined): string | undefined {
  const title = value?.replace(/\s+/g, ' ').trim();
  return title || undefined;
}

function parseIssueTitle(
  html: string,
  issueNumber: number,
): string | undefined {
  const closingHead = /<\/head\s*>/i.exec(html);
  const document = closingHead
    ? html.slice(0, closingHead.index + closingHead[0].length)
    : html;
  const $ = cheerio.load(document);
  const candidates = [
    $('meta[property="og:title"]').first().attr('content'),
    $('meta[name="twitter:title"]').first().attr('content'),
    $('title').first().text(),
  ];
  const selectedTitle = candidates
    .map(normalizeTitle)
    .find((title): title is string => title !== undefined);

  if (!selectedTitle) {
    return undefined;
  }

  const issueDecoration = new RegExp(
    ` · Issue #${issueNumber} · lnreader/lnreader-plugins(?: · GitHub)?$`,
    'i',
  );
  return normalizeTitle(selectedTitle.replace(issueDecoration, ''));
}

async function requestIssueTitle(
  issueNumber: number,
): Promise<string | undefined> {
  try {
    const response = await fetchTimeout(getPluginIssueUrl(issueNumber), {
      headers: { Accept: 'text/html' },
    });
    if (!response.ok) {
      return undefined;
    }

    const title = parseIssueTitle(await response.text(), issueNumber);
    if (title) {
      issueTitles.set(issueNumber, title);
      return title;
    }
  } catch {
    // GitHub metadata is optional. The issue-number link remains usable.
  }

  return undefined;
}

export function getCachedPluginIssueTitle(
  issueNumber: number,
): string | undefined {
  return issueTitles.get(issueNumber);
}

export function loadPluginIssueTitle(
  issueNumber: number,
): Promise<string | undefined> {
  const cachedTitle = getCachedPluginIssueTitle(issueNumber);
  if (cachedTitle !== undefined) {
    return Promise.resolve(cachedTitle);
  }

  const inFlightTitle = inFlightTitles.get(issueNumber);
  if (inFlightTitle) {
    return inFlightTitle;
  }

  const request = requestIssueTitle(issueNumber);
  inFlightTitles.set(issueNumber, request);
  return request.finally(() => {
    if (inFlightTitles.get(issueNumber) === request) {
      inFlightTitles.delete(issueNumber);
    }
  });
}
