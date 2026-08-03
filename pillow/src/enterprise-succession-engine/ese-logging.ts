/** Deliberately excludes credentials, tokens, and sensitive organizational details from logs. */
export function logSuccessionEvent(event: string) {
  return { event, credentialsLogged: false as const, tokensLogged: false as const, sensitiveOrganizationalLogged: false as const };
}
