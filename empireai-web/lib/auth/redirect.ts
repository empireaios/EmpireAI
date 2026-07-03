const DEFAULT_POST_AUTH_PATH = "/cockpit";

/** Safe post-login redirect — cockpit/platform paths only (no open redirects). */
export function resolvePostAuthPath(next: string | null | undefined): string {
  if (!next) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (next.startsWith("/cockpit") || next.startsWith("/platform")) {
    return next;
  }

  return DEFAULT_POST_AUTH_PATH;
}

export function buildLoginPath(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}
