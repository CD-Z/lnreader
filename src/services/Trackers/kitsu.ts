import { AuthenticationResult, Tracker, UserListStatus } from './index';

/**
 * Kitsu Tracker Implementation
 *
 * Kitsu uses username/password authentication with OAuth2 client credentials.
 * It supports refresh tokens for session renewal.
 */

const BASE_URL = 'https://kitsu.app/api/edge/';
const LOGIN_URL = 'https://kitsu.app/api/oauth/token';
const ALGOLIA_KEY_URL = 'https://kitsu.app/api/edge/algolia-keys/media/';

const ALGOLIA_APP_ID = 'AWQO5J657S';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/production_media/query/`;
const ALGOLIA_FILTER =
  '&facetFilters=%5B%22kind%3Amanga%22%5D&attributesToRetrieve=' +
  '%5B%22synopsis%22%2C%22averageRating%22%2C%22canonicalTitle%22%2C%22chapterCount%22%2C%22' +
  'posterImage%22%2C%22startDate%22%2C%22subtype%22%2C%22endDate%22%2C%20%22id%22%5D';

/* Kitsu public OAuth credentials */
const CLIENT_ID =
  'dd031b32d2f56c990b1425efe6c42ad847e7fe3ab46bf1299f05ecd856bdb7dd';
const CLIENT_SECRET =
  '54d7307928f63414defd96399fc31ba847961ceaecef3a5fd93144e960c0e151';

const VND_API_JSON = 'application/vnd.api+json';

/* Kitsu status mapping */
const KITSU_STATUS = {
  CURRENT: 'current',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  DROPPED: 'dropped',
  PLAN_TO_READ: 'planned',
} as const;

export const kitsuToNormalized: Record<string, UserListStatus> = {
  current: 'CURRENT',
  completed: 'COMPLETED',
  on_hold: 'PAUSED',
  dropped: 'DROPPED',
  planned: 'PLANNING',
};

const normalizedToKitsu: Record<UserListStatus, string> = {
  CURRENT: 'current',
  COMPLETED: 'completed',
  PAUSED: 'on_hold',
  DROPPED: 'dropped',
  PLANNING: 'planned',
  REPEATING: 'current',
};

type KitsuAuthMeta = {
  userId: string;
  refreshToken: string;
  createdAt: number;
};

type KitsuOAuth = {
  access_token: string;
  token_type: string;
  created_at: number;
  expires_in: number;
  refresh_token: string;
};

type KitsuAlgoliaSearchItem = {
  id: number;
  canonicalTitle: string;
  chapterCount: number | null;
  subtype: string | null;
  posterImage: {
    original: string;
    large?: string;
    medium?: string;
    small?: string;
    tiny?: string;
  } | null;
  synopsis: string | null;
};

type KitsuLibraryEntry = {
  id: string;
  attributes: {
    status: string;
    progress: number;
    ratingTwenty: number | null;
    startedAt: string | null;
    finishedAt: string | null;
  };
};

/**
 * Authenticates with Kitsu using username and password.
 * This function is called from the login dialog in settings.
 */
export async function authenticateWithCredentials(
  username: string,
  password: string,
): Promise<AuthenticationResult<KitsuAuthMeta>> {
  const formBody = new URLSearchParams({
    username,
    password,
    grant_type: 'password',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (response.status !== 200) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_description || 'Invalid username or password');
  }

  const oauth: KitsuOAuth = await response.json();

  /* Get current user ID */
  const userId = await getCurrentUser(oauth.access_token);

  return {
    accessToken: oauth.access_token,
    refreshToken: oauth.refresh_token,
    expiresAt: new Date((oauth.created_at + oauth.expires_in) * 1000),
    meta: {
      userId,
      refreshToken: oauth.refresh_token,
      createdAt: oauth.created_at,
    },
  };
}

async function getCurrentUser(accessToken: string): Promise<string> {
  const url = `${BASE_URL}users?filter[self]=true`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: VND_API_JSON,
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to get current user');
  }

  const data = await response.json();
  return data.data[0].id;
}

async function getAlgoliaKey(accessToken: string): Promise<string> {
  const response = await fetch(ALGOLIA_KEY_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: VND_API_JSON,
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to get Algolia key');
  }

  const data = await response.json();
  return data.media.key;
}

async function algoliaSearch(
  key: string,
  query: string,
): Promise<KitsuAlgoliaSearchItem[]> {
  const jsonBody = JSON.stringify({
    params: `query=${encodeURIComponent(query)}${ALGOLIA_FILTER}`,
  });

  const response = await fetch(ALGOLIA_URL, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': key,
      'Content-Type': 'application/json',
    },
    body: jsonBody,
  });

  if (response.status !== 200) {
    return [];
  }

  const data = await response.json();
  return data.hits || [];
}

async function findLibraryEntry(
  mediaId: number | string,
  userId: string,
  accessToken: string,
): Promise<{ libraryId: string; entry: KitsuLibraryEntry } | null> {
  const url = `${BASE_URL}library-entries?filter[manga_id]=${mediaId}&filter[user_id]=${userId}&include=manga`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: VND_API_JSON,
    },
  });

  if (response.status !== 200) {
    return null;
  }

  const data = await response.json();

  if (data.data && data.data.length > 0) {
    return {
      libraryId: data.data[0].id,
      entry: data.data[0],
    };
  }

  return null;
}

async function addToLibrary(
  mediaId: number | string,
  userId: string,
  status: string,
  progress: number,
  accessToken: string,
): Promise<string> {
  const body = JSON.stringify({
    data: {
      type: 'libraryEntries',
      attributes: {
        status,
        progress,
      },
      relationships: {
        user: {
          data: {
            id: userId,
            type: 'users',
          },
        },
        media: {
          data: {
            id: String(mediaId),
            type: 'manga',
          },
        },
      },
    },
  });

  const response = await fetch(`${BASE_URL}library-entries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': VND_API_JSON,
      'Accept': VND_API_JSON,
    },
    body,
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error('Failed to add to library');
  }

  const data = await response.json();
  return data.data.id;
}

async function updateLibraryEntry(
  libraryId: string,
  status: string,
  progress: number,
  ratingTwenty: number | null,
  accessToken: string,
): Promise<void> {
  const body = JSON.stringify({
    data: {
      type: 'libraryEntries',
      id: libraryId,
      attributes: {
        status,
        progress,
        ratingTwenty,
      },
    },
  });

  const response = await fetch(`${BASE_URL}library-entries/${libraryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': VND_API_JSON,
      'Accept': VND_API_JSON,
    },
    body,
  });

  if (response.status !== 200) {
    throw new Error('Failed to update library entry');
  }
}

/**
 * Converts a 0-10 score to Kitsu's ratingTwenty (0-20 scale).
 * Kitsu uses a 20-point scale internally (2-20), displayed as 0.5-10.0.
 */
function scoreToRatingTwenty(score: number): number | null {
  if (score <= 0) {
    return null;
  }
  /* Convert 0-10 to 0-20, ensuring minimum of 2 if score > 0 */
  return Math.max(2, Math.round(score * 2));
}

/**
 * Converts Kitsu's ratingTwenty (0-20 scale) to a 0-10 score.
 */
function ratingTwentyToScore(ratingTwenty: number | null): number {
  if (ratingTwenty === null || ratingTwenty <= 0) {
    return 0;
  }
  return ratingTwenty / 2;
}

export const kitsuTracker: Tracker<KitsuAuthMeta> = {
  authenticate: async () => {
    /**
     * Authentication is handled by authenticateWithCredentials
     * which is called from the login dialog in settings.
     */
    throw new Error('Please use the login dialog to authenticate with Kitsu');
  },

  revalidate: async auth => {
    if (!auth.meta?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const formBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: auth.meta.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString();

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (response.status !== 200) {
      throw new Error('Session expired, please re-authenticate');
    }

    const oauth: KitsuOAuth = await response.json();

    return {
      accessToken: oauth.access_token,
      refreshToken: oauth.refresh_token,
      expiresAt: new Date((oauth.created_at + oauth.expires_in) * 1000),
      meta: {
        userId: auth.meta.userId,
        refreshToken: oauth.refresh_token,
        createdAt: oauth.created_at,
      },
    };
  },

  handleSearch: async (search, auth) => {
    try {
      const algoliaKey = await getAlgoliaKey(auth.accessToken);
      const hits = await algoliaSearch(algoliaKey, search);

      /* Filter to only include novels (subtype === 'novel') */
      return hits
        .filter(hit => hit.subtype === 'novel')
        .map(hit => ({
          id: hit.id,
          title: hit.canonicalTitle,
          coverImage: hit.posterImage?.original || '',
          totalChapters: hit.chapterCount || undefined,
        }));
    } catch {
      return [];
    }
  },

  getUserListEntry: async (id, auth) => {
    try {
      const entry = await findLibraryEntry(
        id,
        auth.meta!.userId,
        auth.accessToken,
      );

      if (entry) {
        return {
          status: kitsuToNormalized[entry.entry.attributes.status] || 'CURRENT',
          progress: entry.entry.attributes.progress || 0,
          score: ratingTwentyToScore(entry.entry.attributes.ratingTwenty),
        };
      }

      /* Entry not found, return defaults */
      return {
        status: 'CURRENT',
        progress: 0,
        score: 0,
      };
    } catch {
      return {
        status: 'CURRENT',
        progress: 0,
        score: 0,
      };
    }
  },

  updateUserListEntry: async (id, payload, auth) => {
    const status = payload.status
      ? normalizedToKitsu[payload.status]
      : KITSU_STATUS.CURRENT;
    const progress = Math.round(payload.progress || 0);
    const ratingTwenty = scoreToRatingTwenty(payload.score || 0);

    try {
      /* Check if entry exists */
      const existingEntry = await findLibraryEntry(
        id,
        auth.meta!.userId,
        auth.accessToken,
      );

      let libraryId: string;

      if (existingEntry) {
        libraryId = existingEntry.libraryId;
        await updateLibraryEntry(
          libraryId,
          status,
          progress,
          ratingTwenty,
          auth.accessToken,
        );
      } else {
        /* Create new entry */
        libraryId = await addToLibrary(
          id,
          auth.meta!.userId,
          status,
          progress,
          auth.accessToken,
        );

        /* Update with score if provided */
        if (ratingTwenty !== null) {
          await updateLibraryEntry(
            libraryId,
            status,
            progress,
            ratingTwenty,
            auth.accessToken,
          );
        }
      }

      return {
        status: payload.status || 'CURRENT',
        progress,
        score: payload.score || 0,
      };
    } catch {
      throw new Error('Failed to update Kitsu entry');
    }
  },
};
