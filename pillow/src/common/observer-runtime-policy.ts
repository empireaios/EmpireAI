/**
 * Runtime policy for Pillow's optional, recurring visual/UX observers.
 *
 * The production Brain worker is a headless process.  It still constructs these
 * engines so their APIs remain available, but it must opt in explicitly before
 * their background timer graphs are started.
 */

export type PillowRuntimeEnvironment = Readonly<
  Record<string, string | undefined>
>;

export const PILLOW_OBSERVER_AUTO_START_ENV = {
  visualCapture: "VISUAL_CAPTURE_AUTO_START",
  uiStateMapper: "UI_STATE_MAPPER_AUTO_START",
  componentRecognition: "COMPONENT_RECOGNITION_AUTO_START",
  layoutUnderstanding: "LAYOUT_UNDERSTANDING_AUTO_START",
  navigationMapping: "NAVIGATION_MAPPING_AUTO_START",
  interactionTracking: "INTERACTION_TRACKING_AUTO_START",
  contextAwareness: "CONTEXT_AWARENESS_AUTO_START",
  visualMemory: "VISUAL_MEMORY_AUTO_START",
  sessionContinuity: "SESSION_CONTINUITY_AUTO_START",
} as const;

export type PillowObserverAutoStartEnvironmentKey =
  (typeof PILLOW_OBSERVER_AUTO_START_ENV)[keyof typeof PILLOW_OBSERVER_AUTO_START_ENV];

export const PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION = {
  continuousScreenObservation: "continuousObservationEnabled",
  autonomousUxAudit: "continuousAuditEnabled",
  uxOpportunityDiscovery: "continuousDiscoveryEnabled",
  productivityIntelligence: "continuousLearningEnabled",
  workflowEvolution: "continuousEvolutionEnabled",
  adaptiveInterface: "continuousAdaptationEnabled",
  continuousUxEvolution: "continuousEvolutionEnabled",
  executiveWorkspaceIntelligence: "continuousOptimizationEnabled",
  selfImprovingUx: "continuousLearningEnabled",
} as const;

export type PillowContinuousObserverConfigurationKey =
  (typeof PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION)[keyof typeof PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION];

const explicitTrue = (value: string | undefined): boolean => {
  if (value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
};

export function pillowRecurringObserversEnabled(
  environment: PillowRuntimeEnvironment = process.env,
): boolean {
  if (environment.EMPIRE_ROLE !== "brain-worker") return true;
  return explicitTrue(environment.PILLOW_HEADLESS_OBSERVERS_ENABLED);
}

/** Preserve each legacy auto-start flag after the headless worker gate. */
export function pillowObserverAutoStart(
  environmentKey: PillowObserverAutoStartEnvironmentKey,
  environment: PillowRuntimeEnvironment = process.env,
): boolean {
  return (
    pillowRecurringObserversEnabled(environment) &&
    environment[environmentKey] !== "false"
  );
}

/**
 * Disable only the recurring loop for T5 engines in a headless Brain worker.
 * The engine itself remains enabled and initialized for on-demand API calls.
 */
export function pillowContinuousObserverOptions<
  Key extends PillowContinuousObserverConfigurationKey,
>(
  configurationKey: Key,
  environment: PillowRuntimeEnvironment = process.env,
): { configuration: { [Property in Key]: false } } | undefined {
  if (pillowRecurringObserversEnabled(environment)) return undefined;
  return {
    configuration: {
      [configurationKey]: false,
    } as { [Property in Key]: false },
  };
}
