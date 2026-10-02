/** Legacy bootstrap generates demonstration business data. It is never permitted
 * in the locked production profile, including deferred startup after readiness.
 * Existing evidence is retained; this policy performs no cleanup or migration. */
export function runLegacyBusinessBootstrap(bootstrap: () => void, profile = process.env.EMPIRE_RUNTIME_PROFILE): boolean {
  if (profile) return false;
  bootstrap();
  return true;
}
