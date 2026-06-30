import { z } from "zod";

/** MCL-001 — Success mission: USD 100,000 net profit (not first dollar). */
export const SUCCESS_MISSION_TARGET_USD = 100_000;

export const PROGRAM_STATUS_VALUES = ["COMPLETE", "IN_PROGRESS", "BLOCKED", "PLANNED"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUS_VALUES)[number];

export const programRecordSchema = z.object({
  programId: z.string().min(1),
  name: z.string().min(1),
  completionPercent: z.number().min(0).max(100),
  status: z.enum(PROGRAM_STATUS_VALUES),
  blockers: z.array(z.string()),
  remainingPackages: z.array(z.string()),
  nextCursorMission: z.string(),
  blocksUsd100k: z.boolean(),
  ownerModules: z.array(z.string()),
  dashboardSurface: z.string(),
  operationalAccessNeeded: z.array(z.string()),
  realWorldDependencies: z.array(z.string()),
});

export const successMissionSchema = z.object({
  missionId: z.literal("SUCCESS-001"),
  name: z.literal("USD 100,000 Net Profit"),
  targetNetProfitUsd: z.number(),
  currentNetProfitUsd: z.number(),
  progressPercent: z.number().min(0).max(100),
  phase: z.string(),
  blockers: z.array(z.string()),
  description: z.string(),
});

export const masterCompletionLedgerSchema = z.object({
  moduleId: z.literal("master-completion-ledger"),
  missionId: z.literal("MCL-001"),
  workspaceId: z.string(),
  companyId: z.string(),
  successMission: successMissionSchema,
  programs: z.array(programRecordSchema),
  summary: z.object({
    totalPrograms: z.number().int(),
    averageCompletionPercent: z.number(),
    complete: z.number().int(),
    inProgress: z.number().int(),
    blocked: z.number().int(),
    blockingUsd100k: z.number().int(),
    nextPriorityProgram: z.string().nullable(),
    nextCursorMission: z.string().nullable(),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export const businessCompletionLedgerSchema = z.object({
  moduleId: z.literal("master-completion-ledger"),
  missionId: z.literal("MCL-001-BCL"),
  workspaceId: z.string(),
  companyId: z.string(),
  businessesTracked: z.number().int(),
  launchReady: z.number().int(),
  live: z.number().int(),
  blocked: z.number().int(),
  pipelineProducts: z.number().int(),
  awaitingKingApproval: z.number().int(),
  entries: z.array(z.object({
    label: z.string(),
    value: z.number(),
    status: z.enum(PROGRAM_STATUS_VALUES),
    detail: z.string(),
  })),
  computedAt: z.string().datetime({ offset: true }),
});

export const revenueMissionLedgerSchema = z.object({
  moduleId: z.literal("master-completion-ledger"),
  missionId: z.literal("MCL-001-RML"),
  workspaceId: z.string(),
  companyId: z.string(),
  successMission: successMissionSchema,
  revenueTodayUsd: z.number(),
  estimatedMonthlyRevenueUsd: z.number(),
  netProfitUsd: z.number(),
  ofdPhase: z.string(),
  milestonesAchieved: z.number().int(),
  milestonesTotal: z.number().int(),
  liveProducts: z.number().int(),
  scalingProducts: z.number().int(),
  empireRevenueScore: z.number(),
  blockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export const operationalAccessReportSchema = z.object({
  moduleId: z.literal("master-completion-ledger"),
  missionId: z.literal("MCL-001-OAR"),
  workspaceId: z.string(),
  totalPlatforms: z.number().int(),
  marketplaceProviders: z.number().int(),
  connected: z.number().int(),
  verified: z.number().int(),
  active: z.number().int(),
  blocked: z.number().int(),
  awaitingApproval: z.number().int(),
  amazonStatus: z.string(),
  topBlockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type ProgramRecord = z.infer<typeof programRecordSchema>;
export type SuccessMission = z.infer<typeof successMissionSchema>;
export type MasterCompletionLedger = z.infer<typeof masterCompletionLedgerSchema>;
export type BusinessCompletionLedger = z.infer<typeof businessCompletionLedgerSchema>;
export type RevenueMissionLedger = z.infer<typeof revenueMissionLedgerSchema>;
export type OperationalAccessReport = z.infer<typeof operationalAccessReportSchema>;
