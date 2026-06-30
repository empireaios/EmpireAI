import { z } from "zod";

export const EMPIRE_PLAYBOOKS = [
  "Country Launch",
  "Marketplace Launch",
  "Supplier Selection",
  "Product Launch",
  "Scaling",
  "Recovery",
  "Failure",
  "Expansion",
] as const;

export const playbookSchema = z.object({
  playbookId: z.enum(EMPIRE_PLAYBOOKS),
  title: z.string(),
  phases: z.array(z.string()),
  executiveOwner: z.string(),
  prerequisites: z.array(z.string()),
  estimatedDuration: z.string(),
});

export const empirePlaybookEngineSchema = z.object({
  moduleId: z.literal("empire-playbook-engine"),
  missionId: z.literal("REAL-044"),
  workspaceId: z.string(),
  companyId: z.string(),
  executiveReferenceOnly: z.literal(true),
  playbooks: z.array(playbookSchema),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type EmpirePlaybookId = (typeof EMPIRE_PLAYBOOKS)[number];
export type EmpirePlaybookEngine = z.infer<typeof empirePlaybookEngineSchema>;
