// Shared idea storage, take 3. Vercel Blob needed a storage product created
// and connected in a dashboard; a GitHub Gist removed that but still needed
// a scoped personal access token generated up front. This version needs
// neither: it talks to jsonblob.com's anonymous JSON-store API, which has
// no signup and no token — just an auto-generated numeric ID.
//
// Be clear-eyed about the trade: jsonblob.com is a small, free, unverified
// third-party service with no SLA and no access control beyond the
// obscurity of that ID, and it was unreachable from the sandbox this was
// built in (blocked by egress policy), so none of this has been exercised
// against the real service — only written carefully against its documented
// API shape. If IDEAS_JSONBLOB_ID isn't set, a fresh blob is created
// automatically the first time a server instance needs one, which means
// different cold starts can each spin up their own blob (so different
// people could transiently see different boards) until that ID is copied
// out of the on-page notice and pinned via the env var — after that it's
// stable for everyone, same as the Gist/Blob approaches were.
const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob';

let bootstrappedId = null;

function configuredId() {
  return process.env.IDEAS_JSONBLOB_ID || bootstrappedId;
}

async function createBlob(initial) {
  const res = await fetch(JSONBLOB_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initial),
  });
  if (!res.ok) throw new Error(`jsonblob create failed: ${res.status}`);
  const location = res.headers.get('location') || '';
  const id = location.split('/').filter(Boolean).pop();
  if (!id) throw new Error('jsonblob create returned no id');
  return id;
}

// A pinned id can go stale (the blob got cleaned up by jsonblob.com, or a
// wrong id got copied into the env var) - a 404 here doesn't mean "empty
// board", it means the board itself is gone. Verifying up front and
// self-healing to a fresh blob avoids a confusing crash the moment
// something tries to write to a board that no longer exists.
async function ensureBlobId() {
  const existing = configuredId();
  if (existing) {
    const res = await fetch(`${JSONBLOB_API}/${existing}`, { cache: 'no-store' });
    if (res.ok) return { blobId: existing, justCreated: false, pinnedMissing: false };
    if (res.status !== 404) throw new Error(`jsonblob fetch failed: ${res.status}`);
  }
  const blobId = await createBlob([]);
  bootstrappedId = blobId;
  return { blobId, justCreated: true, pinnedMissing: Boolean(existing) };
}

function isPinned() {
  return Boolean(process.env.IDEAS_JSONBLOB_ID);
}

async function readManifest(blobId) {
  const res = await fetch(`${JSONBLOB_API}/${blobId}`, { cache: 'no-store' });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`jsonblob fetch failed: ${res.status}`);
  return await res.json();
}

async function writeManifest(blobId, ideas) {
  const res = await fetch(`${JSONBLOB_API}/${blobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ideas),
  });
  if (!res.ok) throw new Error(`jsonblob write failed: ${res.status}`);
}

export async function listIdeas() {
  try {
    const { blobId, justCreated, pinnedMissing } = await ensureBlobId();
    const ideas = justCreated ? [] : await readManifest(blobId);
    const pinned = isPinned() && !pinnedMissing;
    return {
      source: 'live',
      ideas,
      // Shown on every load (not just the moment of creation) until
      // IDEAS_JSONBLOB_ID is set — a one-shot notice was too easy to miss,
      // as it was the first time this shipped: the board still worked, but
      // the id to pin it with scrolled off screen and never came back.
      ...(pinned
        ? {}
        : {
            notice: pinnedMissing
              ? `The previously pinned idea board no longer exists on jsonblob.com (any ideas on it are gone). A new one was created (id ${blobId}) — update IDEAS_JSONBLOB_ID to ${blobId} in your deployment's env vars.`
              : `This idea board isn't pinned yet (id ${blobId}). Set IDEAS_JSONBLOB_ID=${blobId} in your deployment's env vars so it doesn't reset on a future cold start.`,
          }),
    };
  } catch (err) {
    return { source: 'unavailable', reason: `Ideas store fetch failed: ${err.message}`, ideas: [] };
  }
}

export async function addIdea({ title, description, timeline, imageBase64, imageType }) {
  const { blobId } = await ensureBlobId();
  const imageUrl = imageBase64 ? `data:${imageType || 'image/jpeg'};base64,${imageBase64}` : null;

  const ideas = await readManifest(blobId);
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
  await writeManifest(blobId, ideas);
  return idea;
}

const VALID_STATUSES = new Set(['pending', 'liked', 'disliked']);

export async function setIdeaStatus(id, status) {
  if (!VALID_STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

  const { blobId } = await ensureBlobId();
  const ideas = await readManifest(blobId);
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('idea not found');
  ideas[idx] = { ...ideas[idx], status };
  await writeManifest(blobId, ideas);
  return ideas[idx];
}
