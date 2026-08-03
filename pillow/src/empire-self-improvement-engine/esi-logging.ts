/** Deliberately excludes sensitive enterprise values from resilience logs. */
export function logResilienceEvent(event: string) { return { event, sensitiveValuesLogged: false as const }; }
