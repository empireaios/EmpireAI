import { z } from "zod";

export const RECOVERY_STRATEGIES = ["RESTART", "SKIP", "FALLBACK", "ROLLBACK", "MANUAL"] as const;

export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[number];

/** Engine recovery plan for failed executions. */
export type EngineRecovery = {
  recoveryId: string;
  engineId: string;
  engineName: string;
  failureReason: string;
  strategy: RecoveryStrategy;
  recoveryAction: string;
  estimatedRecoveryMinutes: number;
  score: number;
};

export const engineRecoverySchema = z.object({
  recoveryId: z.string().min(1),
  engineId: z.string().min(1),
  engineName: z.string().min(1),
  failureReason: z.string().min(1),
  strategy: z.enum(RECOVERY_STRATEGIES),
  recoveryAction: z.string().min(1),
  estimatedRecoveryMinutes: z.number().min(0),
  score: z.number().min(0).max(100),
});

/** Validates an EngineRecovery record shape. */
export function validateEngineRecovery(value: unknown): EngineRecovery {
  return engineRecoverySchema.parse(value);
}
