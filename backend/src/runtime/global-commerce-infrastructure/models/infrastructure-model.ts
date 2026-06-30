import { z } from "zod";

export const InfrastructureLayerIdSchema = z.enum([
  "marketplace",
  "payment",
  "supplier",
  "logistics",
  "advertising",
  "customer_service",
  "tax",
  "compliance",
  "business_registration",
  "language",
  "currency",
  "domain",
]);

export type InfrastructureLayerId = z.infer<typeof InfrastructureLayerIdSchema>;

export const InfrastructureLayerStatusSchema = z.enum([
  "PRESENT",
  "PARTIAL",
  "MISSING",
  "NOT_APPLICABLE",
  "CONDITIONAL",
]);

export type InfrastructureLayerStatus = z.infer<typeof InfrastructureLayerStatusSchema>;

export const InfrastructureLayerSchema = z.object({
  layerId: InfrastructureLayerIdSchema,
  displayName: z.string(),
  status: InfrastructureLayerStatusSchema,
  providerCount: z.number().int().min(0),
  providerIds: z.array(z.string()),
  coverageScore: z.number().min(0).max(100),
  notes: z.array(z.string()).default([]),
});

export type InfrastructureLayer = z.infer<typeof InfrastructureLayerSchema>;

export const CountryInfrastructureProfileSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  regionId: z.string(),
  layers: z.array(InfrastructureLayerSchema),
  infrastructureScore: z.number().min(0).max(100),
  computedAt: z.string(),
});

export type CountryInfrastructureProfile = z.infer<typeof CountryInfrastructureProfileSchema>;

export const INFRASTRUCTURE_LAYER_DEFINITIONS: Array<{ layerId: InfrastructureLayerId; displayName: string }> = [
  { layerId: "marketplace", displayName: "Marketplace Layer" },
  { layerId: "payment", displayName: "Payment Layer" },
  { layerId: "supplier", displayName: "Supplier Layer" },
  { layerId: "logistics", displayName: "Logistics Layer" },
  { layerId: "advertising", displayName: "Advertising Layer" },
  { layerId: "customer_service", displayName: "Customer Service Layer" },
  { layerId: "tax", displayName: "Tax Layer" },
  { layerId: "compliance", displayName: "Compliance Layer" },
  { layerId: "business_registration", displayName: "Business Registration Layer" },
  { layerId: "language", displayName: "Language Layer" },
  { layerId: "currency", displayName: "Currency Layer" },
  { layerId: "domain", displayName: "Domain Layer" },
];
