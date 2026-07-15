// Reddit API — fan discourse/mentions. Free OAuth "script" app from
// reddit.com/prefs/apps, using the app-only client-credentials grant
// (read-only, no user login).
// Env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';
import { STUDIO_NAME } from '../constants';

const USER_AGENT = process.env.REDDIT_USER_AGENT || `web:${STUDIO_NAME.replace(/\s+/g, '')}:1.0`;

function hasCredentials() {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

async function getToken() {
  return memoize('reddit:token', 50 * 60 * 1000, async () => {
    const basic = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`Reddit token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  });
}

export async function getFanDiscourse() {
  if (!hasCredentials()) return unavailable('missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET');
  try {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT };
    return await memoize('reddit:discourse', 15 * 60 * 1000, async () => {
      const [subreddit, mentions] = await Promise.all([
        fetchJson(
          `https://oauth.reddit.com/r/${artistIdentifiers.subreddit}/hot?limit=10`,
          { headers }
        ).catch(() => null),
        fetchJson(
          `https://oauth.reddit.com/search?q=${encodeURIComponent(
            artistIdentifiers.name
          )}&sort=new&limit=15&type=link`,
          { headers }
        ).catch(() => null),
      ]);

      const topPosts = (subreddit?.data?.children || []).map((c) => ({
        id: c.data.id,
        title: c.data.title,
        score: c.data.score,
        numComments: c.data.num_comments,
        createdUtc: c.data.created_utc,
        permalink: `https://reddit.com${c.data.permalink}`,
      }));

      const recentMentions = (mentions?.data?.children || []).map((c) => ({
        id: c.data.id,
        title: c.data.title,
        subreddit: c.data.subreddit,
        score: c.data.score,
        numComments: c.data.num_comments,
        createdUtc: c.data.created_utc,
        permalink: `https://reddit.com${c.data.permalink}`,
      }));

      if (!topPosts.length && !recentMentions.length) {
        throw new Error('no subreddit or mention data returned');
      }

      return live({ subreddit: artistIdentifiers.subreddit, topPosts, recentMentions });
    });
  } catch (err) {
    return unavailable(`Reddit fetch failed: ${err.message}`);
  }
}
