import { z } from "zod";

import { coordinationSignalSchema, type CoordinationSignal } from "./coordination-signal.js";
import { engineDependencySchema, type EngineDependency } from "./engine-dependency.js";
import { engineMonitoringSchema, type EngineMonitoring } from "./engine-monitoring.js";
import { engineRecoverySchema, type EngineRecovery } from "./engine-recovery.js";
import { engineRetrySchema, type EngineRetry } from "./engine-retry.js";
import { engineScheduleSchema, type EngineSchedule } from "./engine-schedule.js";
import { executionGraphSchema, type ExecutionGraph } from "./execution-graph.js";

export type EngineCoordinationReportId = string;

/** Complete engine coordination report — intelligence only, no auto-execute. */
export type EngineCoordinationReport = {
  reportId: EngineCoordinationReportId;
  workspaceId: string;
  reportName: string;
  schedules: EngineSchedule[];
  dependencies: EngineDependency[];
  recoveries: EngineRecovery[];
  retries: EngineRetry[];
  monitoring: EngineMonitoring[];
  executionGraph: ExecutionGraph;
  totalEngines: number;
  overallScore: number;
  confidence: number;
  signals: CoordinationSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoExecuteEnabled: false;
};

export type EngineCoordinationReportCreateInput = Omit<EngineCoordinationReport, "reportId">;

export const engineCoordinationReportSchema = z.object({
  reportId: z.string().min(1),
  workspaceId: z.string().min(1),
  reportName: z.string().min(1),
  schedules: z.array(engineScheduleSchema).min(1),
  dependencies: z.array(engineDependencySchema).min(1),
  recoveries: z.array(engineRecoverySchema),
  retries: z.array(engineRetrySchema).min(1),
  monitoring: z.array(engineMonitoringSchema).min(1),
  executionGraph: executionGraphSchema,
  totalEngines: z.number().int().min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(coordinationSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoExecuteEnabled: z.literal(false),
});

/** Validates an EngineCoordinationReport record shape. */
export function validateEngineCoordinationReport(value: unknown): EngineCoordinationReport {
  return engineCoordinationReportSchema.parse(value);
}
