// Shared idea storage — everyone using the console sees the same deck and
// the same liked/disliked piles, so this can't live in localStorage like
// Strategy does. There's no database in this project, so a single JSON
// blob ("manifest") in Vercel Blob storage acts as a lightweight one:
// every write reads the whole manifest, mutates it, and writes it back.
// That's a real limitation worth stating plainly — two people submitting
// or swiping at the exact same instant can race and one write can clobber
// the other. Fine for a small team's low write-volume idea list; not a
// pattern to reach for at higher scale or write frequency.
//
// This is the third backend this feature has used. A GitHub Gist and then
// jsonblob.com's anonymous API both tried to avoid the Vercel dashboard
// setup step, but jsonblob.com's free tier turned out to garbage-collect
// blobs within minutes in practice, which makes it useless as real
// storage. Vercel Blob is back because it's the one option actually backed
// by infrastructure with a real uptime guarantee.
import { put, head, BlobNotFoundError } from '@vercel/blob';

const MANIFEST_PATHNAME = 'ideas/manifest.json';

export function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readManifest() {
  try {
    const info = await head(MANIFEST_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof BlobNotFoundError) return [];
    throw err;
  }
}

async function writeManifest(ideas) {
  await put(MANIFEST_PATHNAME, JSON.stringify(ideas), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function listIdeas() {
  if (!hasBlobToken()) {
    return { source: 'unavailable', reason: 'missing BLOB_READ_WRITE_TOKEN', ideas: [] };
  }
  try {
    const ideas = await readManifest();
    return { source: 'live', ideas };
  } catch (err) {
    return { source: 'unavailable', reason: `Ideas store fetch failed: ${err.message}`, ideas: [] };
  }
}

async function uploadImage(imageBase64, imageType) {
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = (imageType || 'image/jpeg').split('/')[1]?.split('+')[0] || 'jpg';
  const pathname = `ideas/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploaded = await put(pathname, buffer, {
    access: 'public',
    contentType: imageType || 'image/jpeg',
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return uploaded.url;
}

export async function addIdea({ title, description, timeline, imageBase64, imageType }) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  const imageUrl = imageBase64 ? await uploadImage(imageBase64, imageType) : null;

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
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');
  if (!VALID_STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

  const ideas = await readManifest();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('idea not found');
  ideas[idx] = { ...ideas[idx], status };
  await writeManifest(ideas);
  return ideas[idx];
}

// Bulk verdict switch (multi-select) - one read-modify-write for the whole
// batch rather than one per idea, since every write already re-reads and
// re-writes the entire manifest regardless of how many ideas change.
export async function setIdeasStatus(ids, status) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');
  if (!VALID_STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

  const idSet = new Set(ids);
  const ideas = await readManifest();
  const updated = ideas.map((i) => (idSet.has(i.id) ? { ...i, status } : i));
  await writeManifest(updated);
  return updated.filter((i) => idSet.has(i.id));
}

export async function resetIdeas() {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  const ideas = await readManifest();
  const reset = ideas.map((i) => ({ ...i, status: 'pending' }));
  await writeManifest(reset);
  return reset;
}

export async function updateIdea(id, { title, description, timeline, imageBase64, imageType }) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  const ideas = await readManifest();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('idea not found');

  const imageUrl = imageBase64 ? await uploadImage(imageBase64, imageType) : ideas[idx].imageUrl;

  ideas[idx] = {
    ...ideas[idx],
    title: title !== undefined ? title.trim() : ideas[idx].title,
    description: description !== undefined ? (description || '').trim() : ideas[idx].description,
    timeline: timeline !== undefined ? (timeline || '').trim() : ideas[idx].timeline,
    imageUrl,
  };
  await writeManifest(ideas);
  return ideas[idx];
}

export async function deleteIdea(id) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  const ideas = await readManifest();
  const filtered = ideas.filter((i) => i.id !== id);
  if (filtered.length === ideas.length) throw new Error('idea not found');
  await writeManifest(filtered);
  return { id };
}
