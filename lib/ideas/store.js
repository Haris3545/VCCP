// Shared idea storage — everyone using the console sees the same deck and
// the same liked/disliked piles, so this can't live in localStorage like
// Strategy does. There's no database in this project, so a private GitHub
// Gist acts as one: a single JSON file ("manifest") is read, mutated, and
// written back on every change. Images are embedded as base64 data URIs
// inside that same file instead of a separate storage product, so the only
// credential this feature needs is one GitHub personal access token —
// nothing to create or "connect" in a hosting dashboard. Two people
// submitting or swiping at the exact same instant can race and one write
// can clobber the other — fine for a small team's low write-volume idea
// list, not a pattern to scale up. Keep images modest in size: they all
// live inside one JSON file with no dedicated CDN behind them.
const GITHUB_API = 'https://api.github.com';
const MANIFEST_FILENAME = 'ideas-manifest.json';

function gistId() {
  return process.env.IDEAS_GIST_ID;
}

function gistToken() {
  return process.env.IDEAS_GIST_TOKEN;
}

export function hasGistConfig() {
  return Boolean(gistToken() && gistId());
}

function authHeaders() {
  return {
    Authorization: `Bearer ${gistToken()}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vccp-ideas-tab',
  };
}

async function readManifest() {
  const res = await fetch(`${GITHUB_API}/gists/${gistId()}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`gist fetch failed: ${res.status}`);
  const gist = await res.json();
  const file = gist.files?.[MANIFEST_FILENAME];
  if (!file) return [];

  let content = file.content;
  if (file.truncated) {
    const rawRes = await fetch(file.raw_url, { cache: 'no-store' });
    if (!rawRes.ok) throw new Error(`gist raw fetch failed: ${rawRes.status}`);
    content = await rawRes.text();
  }
  if (!content || !content.trim()) return [];
  return JSON.parse(content);
}

async function writeManifest(ideas) {
  const res = await fetch(`${GITHUB_API}/gists/${gistId()}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: { [MANIFEST_FILENAME]: { content: JSON.stringify(ideas, null, 2) } },
    }),
  });
  if (!res.ok) throw new Error(`gist write failed: ${res.status}`);
}

export async function listIdeas() {
  if (!hasGistConfig()) {
    return { source: 'unavailable', reason: 'missing IDEAS_GIST_TOKEN/IDEAS_GIST_ID', ideas: [] };
  }
  try {
    const ideas = await readManifest();
    return { source: 'live', ideas };
  } catch (err) {
    return { source: 'unavailable', reason: `Ideas store fetch failed: ${err.message}`, ideas: [] };
  }
}

export async function addIdea({ title, description, timeline, imageBase64, imageType }) {
  if (!hasGistConfig()) throw new Error('missing IDEAS_GIST_TOKEN/IDEAS_GIST_ID');

  const imageUrl = imageBase64 ? `data:${imageType || 'image/jpeg'};base64,${imageBase64}` : null;

  const ideas = await readManifest();
  const idea = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    description: (description || '').trim(),
    timeline: (timeline || '').trim(),
    imageUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  ideas.push(idea);
  await writeManifest(ideas);
  return idea;
}

const VALID_STATUSES = new Set(['pending', 'liked', 'disliked']);

export async function setIdeaStatus(id, status) {
  if (!hasGistConfig()) throw new Error('missing IDEAS_GIST_TOKEN/IDEAS_GIST_ID');
  if (!VALID_STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

  const ideas = await readManifest();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('idea not found');
  ideas[idx] = { ...ideas[idx], status };
  await writeManifest(ideas);
  return ideas[idx];
}
