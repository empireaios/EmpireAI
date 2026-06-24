import { randomUUID } from "node:crypto";

import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { InvestigationPriority } from "../../investigation-priority-intelligence/models/investigation-priority.js";
import type { PriorityLevel } from "../../investigation-priority-intelligence/models/investigation-priority.js";
import type { InvestigationTarget } from "../../investigation-priority-intelligence/models/investigation-target.js";
import type { SourceTrustProfile } from "../../source-trust-intelligence/models/source-trust-profile.js";
import type { InvestigationPlanCreateInput } from "../models/investigation-plan.js";
import type { InvestigationStep } from "../models/investigation-step.js";
import type {
  InvestigationTask,
  InvestigationTaskType,
} from "../models/investigation-task.js";

export type InvestigationPlanningInput = {
  target: InvestigationTarget;
  priority: InvestigationPriority;
  trustProfiles: SourceTrustProfile[];
  connectors: EyeConnector[];
};

type TaskBlueprint = {
  taskType: InvestigationTaskType;
  title: string;
  description: string;
  connectorIds: string[];
  baseEffort: number;
  baseValue: number;
};

const TASK_BLUEPRINTS: TaskBlueprint[] = [
  {
    taskType: "CHECK_TREND",
    title: "Validate trend momentum",
    description: "Confirm whether demand signals are accelerating or fading.",
    connectorIds: ["google-trends", "youtube"],
    baseEffort: 18,
    baseValue: 24,
  },
  {
    taskType: "CHECK_SUPPLIER",
    title: "Verify supplier readiness",
    description: "Check supplier availability, lead time, and fulfillment risk.",
    connectorIds: ["cj-dropshipping"],
    baseEffort: 22,
    baseValue: 26,
  },
  {
    taskType: "CHECK_COMPETITOR",
    title: "Map competitor pressure",
    description: "Identify competing listings, positioning, and saturation.",
    connectorIds: ["amazon", "shopify"],
    baseEffort: 20,
    baseValue: 22,
  },
  {
    taskType: "CHECK_MARKETPLACE",
    title: "Audit marketplace presence",
    description: "Review marketplace rankings, reviews, and listing quality.",
    connectorIds: ["amazon", "shopify"],
    baseEffort: 19,
    baseValue: 23,
  },
  {
    taskType: "CHECK_SOCIAL",
    title: "Inspect social traction",
    description: "Measure social buzz, creator activity, and engagement velocity.",
    connectorIds: ["tiktok", "pinterest", "reddit"],
    baseEffort: 17,
    baseValue: 21,
  },
  {
    taskType: "CHECK_SEARCH",
    title: "Analyze search demand",
    description: "Validate query volume, intent, and search-led demand shifts.",
    connectorIds: ["google-trends", "youtube"],
    baseEffort: 16,
    baseValue: 20,
  },
  {
    taskType: "CHECK_PRICING",
    title: "Review pricing band",
    description: "Compare price positioning against market and margin targets.",
    connectorIds: ["amazon", "shopify"],
    baseEffort: 15,
    baseValue: 19,
  },
  {
    taskType: "CHECK_DEMAND",
    title: "Confirm buyer demand",
    description: "Cross-check demand indicators across channels and audiences.",
    connectorIds: ["google-trends", "reddit", "tiktok"],
    baseEffort: 14,
    baseValue: 22,
  },
];

const PRIORITY_TASK_TYPES: Record<PriorityLevel, InvestigationTaskType[]> = {
  CRITICAL: [
    "CHECK_TREND",
    "CHECK_SUPPLIER",
    "CHECK_COMPETITOR",
    "CHECK_MARKETPLACE",
    "CHECK_SOCIAL",
    "CHECK_SEARCH",
    "CHECK_PRICING",
    "CHECK_DEMAND",
  ],
  HIGH: [
    "CHECK_TREND",
    "CHECK_MARKETPLACE",
    "CHECK_SOCIAL",
    "CHECK_SEARCH",
    "CHECK_PRICING",
    "CHECK_DEMAND",
  ],
  MEDIUM: ["CHECK_TREND", "CHECK_MARKETPLACE", "CHECK_DEMAND", "CHECK_PRICING"],
  LOW: ["CHECK_DEMAND"],
};

const PRIORITY_STEP_DEPTH: Record<PriorityLevel, number> = {
  CRITICAL: 3,
  HIGH: 2,
  MEDIUM: 2,
  LOW: 1,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveConnector(
  connectorIds: string[],
  connectors: EyeConnector[],
): EyeConnector | null {
  for (const connectorId of connectorIds) {
    const match = connectors.find((connector) => connector.connectorId === connectorId);
    if (match && match.status !== "DISABLED" && match.status !== "PAUSED") {
      return match;
    }
  }
  return null;
}

function isLowTrustConnector(connectorId: string, trustProfiles: SourceTrustProfile[]): boolean {
  const related = trustProfiles.filter((profile) => profile.connectorId === connectorId);
  if (related.length === 0) {
    return false;
  }
  return related.some((profile) => profile.trustTier === "LOW_TRUST" || profile.trustScore < 50);
}

function buildSteps(
  blueprint: TaskBlueprint,
  connector: EyeConnector | null,
  depth: number,
  productId: string,
  needsTrustVerification: boolean,
): InvestigationStep[] {
  const steps: InvestigationStep[] = [
    {
      stepId: randomUUID(),
      order: 1,
      title: `Collect ${blueprint.taskType.replace("CHECK_", "").toLowerCase()} evidence`,
      description: `Gather fresh evidence for ${productId} using ${connector?.connectorName ?? "available intelligence sources"}.`,
      connectorId: connector?.connectorId ?? null,
      expectedOutcome: "Baseline evidence snapshot captured",
    },
  ];

  if (depth >= 2) {
    steps.push({
      stepId: randomUUID(),
      order: 2,
      title: "Cross-check conflicting signals",
      description: "Compare the latest evidence against prior observations and trend forecasts.",
      connectorId: connector?.connectorId ?? null,
      expectedOutcome: "Signal conflicts identified or ruled out",
    });
  }

  if (depth >= 3 || needsTrustVerification) {
    steps.push({
      stepId: randomUUID(),
      order: steps.length + 1,
      title: "Validate source trustworthiness",
      description: "Verify low-trust sources before the investigation result is promoted to action.",
      connectorId: connector?.connectorId ?? null,
      expectedOutcome: "Trust gaps documented with mitigation steps",
    });
  }

  return steps;
}

function buildTask(
  blueprint: TaskBlueprint,
  priority: InvestigationPriority,
  connectors: EyeConnector[],
  trustProfiles: SourceTrustProfile[],
): InvestigationTask {
  const connector = resolveConnector(blueprint.connectorIds, connectors);
  const depth = PRIORITY_STEP_DEPTH[priority.priorityLevel];
  const needsTrustVerification =
    priority.uncertaintyScore >= 55 ||
    (connector ? isLowTrustConnector(connector.connectorId, trustProfiles) : false);

  const priorityBoost = priority.investigationPriorityScore / 100;
  const urgencyBoost = priority.urgencyScore / 100;
  const trustPenalty = priority.trustScore < 55 ? 8 : 0;

  const effortScore = clampScore(
    blueprint.baseEffort + depth * 6 + (needsTrustVerification ? 8 : 0) + trustPenalty,
  );
  const valueScore = clampScore(
    blueprint.baseValue +
      priorityBoost * 20 +
      urgencyBoost * 15 +
      (needsTrustVerification ? 6 : 0),
  );

  return {
    taskId: randomUUID(),
    taskType: blueprint.taskType,
    title: blueprint.title,
    description: blueprint.description,
    connectorId: connector?.connectorId ?? null,
    effortScore,
    valueScore,
    steps: buildSteps(
      blueprint,
      connector,
      depth,
      priority.productId,
      needsTrustVerification,
    ),
  };
}

function rankTasks(tasks: InvestigationTask[]): string[] {
  return [...tasks]
    .sort((left, right) => {
      const leftRatio = left.valueScore / Math.max(left.effortScore, 1);
      const rightRatio = right.valueScore / Math.max(right.effortScore, 1);
      return rightRatio - leftRatio || right.valueScore - left.valueScore;
    })
    .map((task) => task.taskId);
}

function estimatePlanValue(tasks: InvestigationTask[], priority: InvestigationPriority): number {
  return clampScore(
    average(tasks.map((task) => task.valueScore)) * 0.55 +
      priority.investigationPriorityScore * 0.45,
  );
}

function estimatePlanEffort(tasks: InvestigationTask[], priority: InvestigationPriority): number {
  const stepCount = tasks.reduce((total, task) => total + task.steps.length, 0);
  return clampScore(
    average(tasks.map((task) => task.effortScore)) * 0.6 +
      stepCount * 3 +
      priority.uncertaintyScore * 0.15,
  );
}

/** Converts investigation priorities into executable investigation plans. */
export class InvestigationPlanningEngine {
  plan(input: InvestigationPlanningInput): InvestigationPlanCreateInput {
    const { target, priority, trustProfiles, connectors } = input;

    if (target.targetId !== priority.targetId) {
      throw new Error("Investigation target and priority targetId must match");
    }

    const selectedTypes = PRIORITY_TASK_TYPES[priority.priorityLevel];
    const tasks = TASK_BLUEPRINTS.filter((blueprint) =>
      selectedTypes.includes(blueprint.taskType),
    ).map((blueprint) => buildTask(blueprint, priority, connectors, trustProfiles));

    if (tasks.length === 0) {
      throw new Error("At least one investigation task is required");
    }

    const recommendedOrder = rankTasks(tasks);

    return {
      targetId: target.targetId,
      productId: target.productId,
      priority: priority.priorityLevel,
      tasks,
      estimatedValue: estimatePlanValue(tasks, priority),
      estimatedEffort: estimatePlanEffort(tasks, priority),
      recommendedOrder,
    };
  }
}

export const defaultInvestigationPlanningEngine = new InvestigationPlanningEngine();

export const investigationPlanning = {
  PRIORITY_TASK_TYPES,
  PRIORITY_STEP_DEPTH,
  rankTasks,
  estimatePlanValue,
  estimatePlanEffort,
} as const;
