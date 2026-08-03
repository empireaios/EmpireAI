/** X3-11 — Shared structural operational elasticity helpers. */

import { OEE_METADATA_VERSION } from "./paths.js";
import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type {
  ElasticityOperation,
  ElasticityRecord,
  OperationalElasticityInput,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampAdjustment(
  value: number,
  maxAbs: number,
): number {
  return Math.max(-maxAbs, Math.min(maxAbs, Math.round(value)));
}

export function defaultCompany(input?: OperationalElasticityInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultComponent(input?: OperationalElasticityInput): string {
  return input?.operationalComponent?.trim() || "ops-component-default";
}

export function buildElasticityRecord(input: {
  companyReference: string;
  operationalComponent: string;
  currentUtilization: number;
  targetUtilization: number;
  scalingAdjustment: number;
  resourceAllocationSummary: string;
  config: OperationalElasticityEngineConfiguration;
}): ElasticityRecord {
  const currentUtilization = clampScore(input.currentUtilization);
  const targetUtilization = clampScore(input.targetUtilization);
  let scalingAdjustment = clampAdjustment(
    input.scalingAdjustment,
    input.config.maxScalingAdjustment,
  );

  // Never exceed validated operational limits — clamp structural delta to approved bounds.
  if (input.config.neverExceedValidatedOperationalLimits) {
    scalingAdjustment = clampAdjustment(
      scalingAdjustment,
      input.config.maxScalingAdjustment,
    );
  }

  return {
    elasticityRecordId: `oee-er-${Date.now()}-${input.operationalComponent.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    operationalComponent: input.operationalComponent,
    currentUtilization,
    targetUtilization,
    scalingAdjustment,
    resourceAllocationSummary: input.resourceAllocationSummary,
    validationStatus: "passed",
    metadataVersion: OEE_METADATA_VERSION,
    neverExceedValidatedOperationalLimits: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computeElasticitySignals(
  operation: ElasticityOperation,
  input: OperationalElasticityInput,
  config: OperationalElasticityEngineConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  operationalComponent: string;
  currentUtilization: number;
  targetUtilization: number;
  scalingAdjustment: number;
  resourceAllocationSummary: string;
} {
  const company = defaultCompany(input);
  const component = defaultComponent(input);
  const seed = `${company}::${component}::${operation}`;

  const currentUtilization = clampScore(
    input.utilizationHint ?? hashScore(`${seed}:utilization`, 20, 95),
  );
  const targetUtilization = clampScore(
    input.targetUtilizationHint ?? config.targetUtilizationDefault,
  );
  const demandScore = clampScore(
    input.demandHint ?? hashScore(`${seed}:demand`, 20, 95),
  );
  const capacityScore = clampScore(
    input.capacityHint ?? hashScore(`${seed}:capacity`, 20, 95),
  );

  const rawDelta = targetUtilization - currentUtilization;
  let scalingAdjustment = clampAdjustment(
    rawDelta * 0.35 + (demandScore - capacityScore) * 0.1,
    config.maxScalingAdjustment,
  );

  let resourceAllocationSummary =
    "Elasticity signals within validated operational limits — structural signals only";

  if (!sourceAvailable) {
    resourceAllocationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only`;
    scalingAdjustment = clampAdjustment(
      Math.min(Math.abs(scalingAdjustment), 5) * Math.sign(scalingAdjustment || 1),
      Math.min(5, config.maxScalingAdjustment),
    );
  } else if (operation === "scale_up") {
    scalingAdjustment = Math.abs(scalingAdjustment) || 5;
    resourceAllocationSummary = `Scale capacity upward by ${scalingAdjustment} on ${component} · util ${currentUtilization}% → target ${targetUtilization}%`;
  } else if (operation === "scale_down") {
    scalingAdjustment = -(Math.abs(scalingAdjustment) || 5);
    resourceAllocationSummary = `Scale capacity downward by ${Math.abs(scalingAdjustment)} on ${component} · util ${currentUtilization}% → target ${targetUtilization}%`;
  } else if (operation === "overcapacity" && currentUtilization >= config.overcapacityThreshold) {
    scalingAdjustment = -Math.abs(scalingAdjustment || 8);
    resourceAllocationSummary = `Overcapacity at ${currentUtilization}% (threshold ${config.overcapacityThreshold}) — contract capacity structurally`;
  } else if (operation === "undercapacity" && currentUtilization <= config.undercapacityThreshold) {
    scalingAdjustment = Math.abs(scalingAdjustment || 8);
    resourceAllocationSummary = `Undercapacity at ${currentUtilization}% (threshold ${config.undercapacityThreshold}) — expand capacity structurally`;
  } else if (operation === "demand" && demandScore >= config.demandThreshold) {
    resourceAllocationSummary = `Elevated demand ${demandScore} on ${component} · util ${currentUtilization}% — monitor elasticity`;
  } else if (operation === "utilization" && currentUtilization >= config.utilizationThreshold) {
    resourceAllocationSummary = `Utilization ${currentUtilization}% above threshold ${config.utilizationThreshold} on ${component}`;
  } else if (operation === "workload_balance") {
    resourceAllocationSummary = `Workload balance on ${component} · util ${currentUtilization}% · demand ${demandScore} · capacity ${capacityScore}`;
  } else if (operation === "resource_optimization") {
    resourceAllocationSummary = `Resource optimization on ${component} · util ${currentUtilization}% → target ${targetUtilization}% · adj ${scalingAdjustment}`;
  } else {
    resourceAllocationSummary = `Validated ${operation} signals support cautious elasticity monitoring`;
  }

  if (config.neverExceedValidatedOperationalLimits) {
    scalingAdjustment = clampAdjustment(scalingAdjustment, config.maxScalingAdjustment);
  }

  return {
    companyReference: company,
    operationalComponent: component,
    currentUtilization,
    targetUtilization,
    scalingAdjustment,
    resourceAllocationSummary,
  };
}
