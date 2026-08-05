/** Dependency bag accepted when wiring integrations during session bootstrap. */
export type IntegrationWiringDeps = Record<string, unknown>;

/** Widens public bindIntegrations entry points for session bootstrap wiring. */
export function asIntegrationWiringDeps<T extends object>(deps: T): IntegrationWiringDeps {
  return deps as IntegrationWiringDeps;
}

/** Invokes bindIntegrations with a structurally compatible dependency bag. */
export function invokeBindIntegrations(
  target: { bindIntegrations(deps: IntegrationWiringDeps): void },
  deps: IntegrationWiringDeps,
): void {
  target.bindIntegrations(deps);
}

/** Invokes bindIntegrations from any engine that still types deps strictly. */
export function wireEngineIntegrations(
  target: { bindIntegrations(deps: never): void },
  deps: IntegrationWiringDeps,
): void {
  (target.bindIntegrations as (deps: IntegrationWiringDeps) => void)(deps);
}
