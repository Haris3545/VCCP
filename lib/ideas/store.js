// Shared idea storage — everyone using the console sees the same deck and
// the same liked/disliked piles, so this can't live in localStorage like
// Strategy does. There's no database in this project, so a single JSON
// blob ("manifest") in Vercel Blob storage acts as a lightweight one:
// every write reads the whole manifest, mutates it, and writes it back.
// That's a real limitation worth stating plainly — two people submitting
// or swiping at the exact same instant can race and one write can clobber
// the other. Fine for a small team's low write-volume idea list; not a
// pattern to reach for at higher scale or write frequency.
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

export async function addIdea({ title, description, timeline, imageBase64, imageType }) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  let imageUrl = null;
  if (imageBase64) {
    const buffer = Buffer.from(imageBase64, 'base64');
    const ext = (imageType || 'image/jpeg').split('/')[1]?.split('+')[0] || 'jpg';
    const pathname = `ideas/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploaded = await put(pathname, buffer, {
      access: 'public',
      contentType: imageType || 'image/jpeg',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    imageUrl = uploaded.url;
  }

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
