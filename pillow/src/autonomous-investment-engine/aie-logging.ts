/** Deliberately excludes credentials, tokens, and sensitive financial details from logs. */
export function logInvestmentEvent(event: string) {
  return { event, credentialsLogged: false as const, tokensLogged: false as const, sensitiveFinancialLogged: false as const };
}
