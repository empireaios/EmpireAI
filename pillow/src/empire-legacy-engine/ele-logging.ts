/** Deliberately excludes credentials, tokens, and sensitive enterprise details from logs. */
export function logLegacyEvent(event: string) {
  return { event, credentialsLogged: false as const, tokensLogged: false as const, sensitiveEnterpriseLogged: false as const };
}
