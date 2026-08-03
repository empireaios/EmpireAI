/** Deliberately excludes credentials, tokens, and sensitive governance details from logs. */
export function logGovernanceEvent(event: string) {
  return { event, credentialsLogged: false as const, tokensLogged: false as const, sensitiveGovernanceLogged: false as const };
}
