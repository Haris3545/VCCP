import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';

export function proxy(req) {
  const cookie = req.cookies.get(SESSION_COOKIE);
  if (cookie?.value === SESSION_VALUE) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Mirrors artistConfig.tabs — Next.js needs this matcher list statically,
// so it can't just be derived from the config array at build time.
export const config = {
  matcher: [
    '/dashboard',
    '/media',
    '/media-2',
    '/social-listening',
    '/music',
    '/youtube',
    '/audience',
    '/strategy',
    '/tactics',
    '/locations',
    '/ideas',
    '/calendar',
    '/research',
  ],
};
