// Non-secure shared-password gate — matches the reference product's UX, not
// a real auth boundary. Do not use this pattern for anything that needs
// actual security.
export const SESSION_COOKIE = 'vccp_session';
export const SESSION_VALUE = 'granted';

export function isAuthedRequestCookie(cookieHeader) {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .some((part) => part === `${SESSION_COOKIE}=${SESSION_VALUE}`);
}
