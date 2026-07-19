/** R1-15 — Mission validation helpers. */

import type { MissionValidationResult } from "./types.js";

export function buildMissionResult(input: {
  missionId: string;
  missionLabel: string;
  started: number;
  errors?: string[];
  warnings?: string[];
}): MissionValidationResult {
  const errors = input.errors ?? [];
  const warnings = input.warnings ?? [];
  const status = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
  return {
    missionId: input.missionId,
    missionLabel: input.missionLabel,
    status,
    errors,
    warnings,
    durationMs: Date.now() - input.started,
  };
}

export function validateEngineMission(input: {
  missionId: string;
  missionLabel: string;
  engine: { getState: () => { missionId: string; engineVersion: string; status: string } } | null;
  expectedMissionId: string;
  smokeTest?: () => Promise<void> | void;
}): Promise<MissionValidationResult> {
  const started = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.engine) {
    errors.push(`${input.missionLabel} engine not available`);
    return Promise.resolve(buildMissionResult({ ...input, started, errors, warnings }));
  }

  try {
    const state = input.engine.getState();
    if (state.missionId !== input.expectedMissionId) {
      errors.push(`Expected mission ${input.expectedMissionId}, got ${state.missionId}`);
    }
    if (!state.engineVersion) errors.push("Missing engine version");
    if (state.status === "failed") warnings.push("Engine status is failed");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Engine state unavailable");
  }

  if (input.smokeTest && errors.length === 0) {
    return Promise.resolve()
      .then(() => input.smokeTest!())
      .then(() => buildMissionResult({ ...input, started, errors, warnings }))
      .catch((error) =>
        buildMissionResult({
          ...input,
          started,
          errors: [...errors, error instanceof Error ? error.message : "Smoke test failed"],
          warnings,
        }),
      );
  }

  return Promise.resolve(buildMissionResult({ ...input, started, errors, warnings }));
}
