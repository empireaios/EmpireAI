/** E5-15 — Grand King Executive Cockpit configuration. */

export type CockpitEngineConfiguration = {
  refreshIntervalSeconds: number;
  widgetStaleThresholdMinutes: number;
  governanceChainRequired: boolean;
  minimumEvidenceCount: number;
  continuousRefreshEnabled: boolean;
  singleInterfaceEnforced: boolean;
};

export const DEFAULT_COCKPIT_CONFIGURATION: CockpitEngineConfiguration = {
  refreshIntervalSeconds: 5,
  widgetStaleThresholdMinutes: 10,
  governanceChainRequired: true,
  minimumEvidenceCount: 1,
  continuousRefreshEnabled: true,
  singleInterfaceEnforced: true,
};

export function buildCockpitConfiguration(
  overrides: Partial<CockpitEngineConfiguration> = {},
): CockpitEngineConfiguration {
  return { ...DEFAULT_COCKPIT_CONFIGURATION, ...overrides };
}
