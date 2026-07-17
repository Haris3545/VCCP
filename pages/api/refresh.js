import { isAuthedRequestCookie } from '@/lib/auth';
import { clearCache } from '@/lib/integrations/http';
import { resetIdeas } from '@/lib/ideas/store';

// Every ISR-backed page that pulls from lib/dataSource.js — kept as a
// literal list because res.revalidate() needs each path up front, same
// reason proxy.js's matcher can't be derived from artistConfig.tabs.
const REVALIDATE_PATHS = ['/dashboard', '/music', '/youtube', '/social-listening'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  clearCache();

  const failed = [];
  for (const path of REVALIDATE_PATHS) {
    try {
      await res.revalidate(path);
    } catch (err) {
      failed.push(`${path} (${err.message})`);
    }
  }

  // "Refresh everything" is the site's one catch-all restore action, so it
  // also puts every idea's verdict back to pending - same effect the old,
  // ideas-only "Reset ideas" button had, without a separate confirm dialog
  // to ask for since this button already reloads the whole page on success.
  try {
    await resetIdeas();
  } catch (err) {
    failed.push(`ideas reset (${err.message})`);
  }

  if (failed.length) {
    return res.status(207).json({ ok: false, error: `Failed to refresh: ${failed.join(', ')}` });
  }

  return res.status(200).json({ ok: true, refreshed: REVALIDATE_PATHS });
}
