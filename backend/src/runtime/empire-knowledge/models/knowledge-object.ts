import { z } from "zod";

export const KnowledgeObjectTypeSchema = z.enum([
  "country",
  "marketplace",
  "supplier",
  "product",
  "customer",
  "business",
  "campaign",
  "failure",
  "success",
  "launch",
  "competition",
  "payment",
  "logistics",
  "advertising",
]);

export type KnowledgeObjectType = z.infer<typeof KnowledgeObjectTypeSchema>;

export const KnowledgeObjectSchema = z.object({
  objectId: z.string(),
  objectType: KnowledgeObjectTypeSchema,
  workspaceId: z.string(),
  companyId: z.string().optional(),
  displayName: z.string(),
  externalRef: z.string().optional(),
  attributes: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100),
  source: z.enum(["SEED", "LEARNING", "INTELLIGENCE", "OPERATION", "MANUAL"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type KnowledgeObject = z.infer<typeof KnowledgeObjectSchema>;

export const CreateKnowledgeObjectInputSchema = z.object({
  objectType: KnowledgeObjectTypeSchema,
  displayName: z.string().min(1),
  companyId: z.string().optional(),
  externalRef: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100).default(50),
  source: KnowledgeObjectSchema.shape.source.default("MANUAL"),
});

export type CreateKnowledgeObjectInput = z.input<typeof CreateKnowledgeObjectInputSchema>;
