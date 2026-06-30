import { z } from "zod";

export const EMPIRE_AUDIT_SIGNAL_TYPES = [
  "architecture_audit",
  "security_audit",
  "scalability_audit",
  "performance_audit",
  "reliability_audit",
  "business_readiness",
  "deployment_readiness",
  "launch_readiness",
  "audit_composite",
] as const;

export type EmpireAuditSignalType = (typeof EMPIRE_AUDIT_SIGNAL_TYPES)[number];

/** Scoring signal for empire audit confidence. */
export type EmpireAuditSignal = {
  signalType: EmpireAuditSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const empireAuditSignalSchema = z.object({
  signalType: z.enum(EMPIRE_AUDIT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an EmpireAuditSignal record shape. */
export function validateEmpireAuditSignal(value: unknown): EmpireAuditSignal {
  return empireAuditSignalSchema.parse(value);
}
