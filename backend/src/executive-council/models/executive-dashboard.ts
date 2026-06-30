import { z } from "zod";
import { ExecutiveConsensusSchema } from "./executive-core.js";
import { ExecutiveGeneratedMissionSchema } from "./executive-mission.js";
import { RegisteredExecutiveSchema } from "./executive-registry.js";

export const ExecutiveHeadquartersDashboardSchema = z.object({
  moduleId: z.literal("executive-council"),
  missionId: z.literal("EC-001-EC-010"),
  ceoBriefing: z.string(),
  executiveCouncil: z.object({
    totalExecutives: z.number(),
    activeExecutives: z.number(),
    registeredExecutives: z.array(RegisteredExecutiveSchema),
  }),
  currentDebate: z
    .object({
      sessionId: z.string(),
      topic: z.string(),
      consensus: ExecutiveConsensusSchema,
      opinionCount: z.number(),
    })
    .nullable(),
  consensus: ExecutiveConsensusSchema.nullable(),
  disagreements: z.array(
    z.object({
      conflictId: z.string(),
      topic: z.string(),
      opposingExecutives: z.array(z.string()),
      severity: z.string(),
    }),
  ),
  highestConfidenceExecutive: z
    .object({ executiveId: z.string(), title: z.string(), confidence: z.number() })
    .nullable(),
  mostActiveExecutive: z
    .object({ executiveId: z.string(), title: z.string(), recommendationCount: z.number() })
    .nullable(),
  recommendationsAwaitingKing: z.array(
    z.object({
      decisionId: z.string(),
      topic: z.string(),
      majorityRecommendation: z.string().optional(),
      consensus: ExecutiveConsensusSchema,
    }),
  ),
  commercialConfidence: z.number(),
  todaysStrategicDecisions: z.array(
    z.object({ decisionId: z.string(), topic: z.string(), consensus: ExecutiveConsensusSchema }),
  ),
  commercialOpportunities: z.array(ExecutiveGeneratedMissionSchema),
  risks: z.array(ExecutiveGeneratedMissionSchema),
  expansionRecommendations: z.array(ExecutiveGeneratedMissionSchema),
  empireEconomics: z.object({
    monthlyRevenueEstimate: z.number().optional(),
    commercialConfidence: z.number(),
    activeDebateCount: z.number(),
  }),
  generatedMissions: z.array(ExecutiveGeneratedMissionSchema),
  workflow: z.array(z.object({ stage: z.number(), label: z.string(), module: z.string() })),
  operationalAccess: z.object({
    architectureComplete: z.boolean(),
    totalPlatforms: z.number(),
    connected: z.number(),
    blocked: z.number(),
    ready: z.number(),
    revenueBlockingGaps: z.number(),
    highestPriorityAction: z.string().nullable(),
    requiredAuthorizations: z.number(),
  }).optional(),
  supplierIntelligence: z.object({
    architectureComplete: z.boolean(),
    architecturePercent: z.number(),
    productsFound: z.number(),
    productsUnderReview: z.number(),
    supplierRisks: z.number(),
    cjReadinessPercent: z.number(),
    shippingRiskCount: z.number(),
    topOpportunity: z.string().nullable(),
    supplyChainBrief: z.string().nullable(),
    merchantBrief: z.string().nullable(),
  }).optional(),
  globalMarketplaceOperations: z.object({
    architecturePercent: z.number(),
    countriesActive: z.number(),
    countriesReady: z.number(),
    countriesBlocked: z.number(),
    marketplacesConnected: z.number(),
    productsLive: z.number(),
    productsAwaitingApproval: z.number(),
    totalRevenueUsd: z.number(),
    totalProfitUsd: z.number(),
    nextRecommendedCountry: z.string().nullable(),
    topOpportunityCountry: z.string().nullable(),
  }).optional(),
  globalCommandCenter: z.object({
    architecturePercent: z.number(),
    globalRevenueUsd: z.number(),
    globalProfitUsd: z.number(),
    productWinners: z.number(),
    productsAtRisk: z.number(),
    supplierHealthScore: z.number(),
    improvementProposals: z.number(),
    opportunitiesQueued: z.number(),
    kingApprovalQueue: z.number(),
    successMissionProgressPercent: z.number(),
  }).optional(),
  computedAt: z.string(),
});
export type ExecutiveHeadquartersDashboard = z.infer<typeof ExecutiveHeadquartersDashboardSchema>;
