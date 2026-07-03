/**
 * EKLS — Unified Executive Intelligence Service.
 * Schedules, coordinates, aggregates — owns no business logic.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

import { EKLS_SUBSYSTEM_REGISTRY } from "../contracts/subsystem-registry.js";
import { EKLS_LIFECYCLE_REGISTRY } from "../contracts/lifecycles.js";
import { EKLS_STORE_REGISTRY } from "../storage/store-registry.js";
import {
  enforceEklsAccess,
  type EklsGovernanceContext,
  EKLS_CANONICAL_SPEC_REF,
} from "./ekls-governance-gateway.js";
import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "../../../../domain/services/executive-intelligence-orchestrator-views.js";

export const EKLS_CONSUMER_CHANNELS = [
  "cockpit",
  "pillow",
  "global-ai-assistant",
  "business-automation",
  "executive-reports",
] as const;

export type EklsConsumerChannel = (typeof EKLS_CONSUMER_CHANNELS)[number];

export type EklsScheduleSlot = {
  slotId: string;
  label: string;
  cadence: "continuous" | "hourly" | "daily" | "on-demand";
  subsystemIds: string[];
  consumerChannels: EklsConsumerChannel[];
};

export type EklsConsumerDelivery = {
  consumerId: EklsConsumerChannel;
  deliveryMode: string;
  payloadSummary: string;
  recommendedAction: string;
  bridgeModule: string;
  orchestrationOnly: true;
};

export type EklsUnifiedServiceView = {
  schemaVersion: "ekls-v1";
  specRef: typeof EKLS_CANONICAL_SPEC_REF;
  orchestrationPolicy: "no_business_logic";
  owner: "pillow";
  subsystemCount: number;
  storeBackendCount: number;
  lifecycleDomains: string[];
  aggregatedSummary: string;
  executiveDecisionRecommendation: string | null;
  scheduleSlots: EklsScheduleSlot[];
  consumerDeliveries: EklsConsumerDelivery[];
  governanceAudit: ReturnType<typeof enforceEklsAccess>;
  computedAt: string;
};

export const EKLS_SCHEDULE_MANIFEST: readonly EklsScheduleSlot[] = [
  {
    slotId: "continuous-observations",
    label: "Continuous observation ingestion",
    cadence: "continuous",
    subsystemIds: ["observation_store", "evidence_store"],
    consumerChannels: ["pillow", "global-ai-assistant"],
  },
  {
    slotId: "hourly-learning",
    label: "Hourly learning accumulation",
    cadence: "hourly",
    subsystemIds: ["learning_store", "pattern_store", "confidence_history"],
    consumerChannels: ["pillow", "business-automation"],
  },
  {
    slotId: "daily-suite-memory",
    label: "Daily full memory aggregation",
    cadence: "daily",
    subsystemIds: ["knowledge_store", "experience_store", "decision_history", "audit_memory"],
    consumerChannels: ["executive-reports", "cockpit"],
  },
  {
    slotId: "on-demand-retrieval",
    label: "On-demand semantic retrieval",
    cadence: "on-demand",
    subsystemIds: ["semantic_memory", "knowledge_graph"],
    consumerChannels: ["global-ai-assistant", "cockpit", "pillow"],
  },
];

function buildConsumerDeliveries(
  aggregatedSummary: string,
  executiveRecommendation: string | null,
): EklsConsumerDelivery[] {
  return [
    {
      consumerId: "cockpit",
      deliveryMode: "visualise-only",
      payloadSummary: aggregatedSummary,
      recommendedAction: executiveRecommendation ?? "Load EKLS unified service via Pillow",
      bridgeModule: "cockpit-interaction",
      orchestrationOnly: true,
    },
    {
      consumerId: "pillow",
      deliveryMode: "govern-full",
      payloadSummary: aggregatedSummary,
      recommendedAction: "Govern knowledge quality and approve learnings",
      bridgeModule: "pillow-host",
      orchestrationOnly: true,
    },
    {
      consumerId: "global-ai-assistant",
      deliveryMode: "summary-retrieval",
      payloadSummary: aggregatedSummary,
      recommendedAction: executiveRecommendation ?? "Delegate reasoning to G4-07 — EKLS supplies memory",
      bridgeModule: "global-assistant",
      orchestrationOnly: true,
    },
    {
      consumerId: "business-automation",
      deliveryMode: "schedule-gate",
      payloadSummary: `Schedule manifest · ${EKLS_SCHEDULE_MANIFEST.length} slots`,
      recommendedAction: "G5 automation consumes schedule manifest after Pillow approval",
      bridgeModule: "business-automation",
      orchestrationOnly: true,
    },
    {
      consumerId: "executive-reports",
      deliveryMode: "report-bundle",
      payloadSummary: `${EKLS_SUBSYSTEM_REGISTRY.length} subsystems · ${EKLS_STORE_REGISTRY.length} backends`,
      recommendedAction: executiveRecommendation ?? "Generate executive report from EKLS aggregation",
      bridgeModule: "executive-reports",
      orchestrationOnly: true,
    },
  ];
}

export function loadEklsUnifiedService(
  context: EklsGovernanceContext,
): EklsUnifiedServiceView {
  const governanceAudit = enforceEklsAccess(context, context.workspaceId);
  if (!governanceAudit.allowed) {
    throw new Error(governanceAudit.reason);
  }

  let executiveRecommendation: string | null = null;
  let aggregatedSummary = `EKLS · ${EKLS_SUBSYSTEM_REGISTRY.length} subsystems · Pillow-governed institutional memory`;

  try {
    const g310 = loadExecutiveIntelligenceOrchestratorViewForWorkspace(context.workspaceId);
    executiveRecommendation = g310.unifiedService.decisionSnapshot.executiveRecommendation;
    aggregatedSummary = `EKLS + G3-10 · ${g310.unifiedService.enginesAvailable}/9 engines · ${g310.unifiedService.decisionSnapshot.finalRecommendation}`;
  } catch {
    /* orchestrator optional for EKLS aggregation */
  }

  return {
    schemaVersion: "ekls-v1",
    specRef: EKLS_CANONICAL_SPEC_REF,
    orchestrationPolicy: "no_business_logic",
    owner: "pillow",
    subsystemCount: EKLS_SUBSYSTEM_REGISTRY.length,
    storeBackendCount: EKLS_STORE_REGISTRY.length,
    lifecycleDomains: Object.keys(EKLS_LIFECYCLE_REGISTRY),
    aggregatedSummary,
    executiveDecisionRecommendation: executiveRecommendation,
    scheduleSlots: [...EKLS_SCHEDULE_MANIFEST],
    consumerDeliveries: buildConsumerDeliveries(aggregatedSummary, executiveRecommendation),
    governanceAudit,
    computedAt: new Date().toISOString(),
  };
}
