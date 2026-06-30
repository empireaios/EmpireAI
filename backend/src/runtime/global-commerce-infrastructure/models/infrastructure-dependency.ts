import { z } from "zod";

import { InfrastructureLayerIdSchema } from "./infrastructure-model.js";

export const DependencyRequirementSchema = z.enum([
  "REQUIRED",
  "RECOMMENDED",
  "OPTIONAL",
  "CONDITIONAL",
  "NOT_REQUIRED",
]);

export type DependencyRequirement = z.infer<typeof DependencyRequirementSchema>;

export const InfrastructureDependencySchema = z.object({
  dependencyId: z.string(),
  providerId: z.string(),
  providerDisplayName: z.string(),
  countryCode: z.string(),
  layerId: InfrastructureLayerIdSchema,
  requirement: DependencyRequirementSchema,
  component: z.string(),
  rationale: z.string(),
  humanActionRequired: z.boolean(),
  automatable: z.boolean(),
});

export type InfrastructureDependency = z.infer<typeof InfrastructureDependencySchema>;

export const ProviderDependencyProfileSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  countryCode: z.string(),
  dependencies: z.array(InfrastructureDependencySchema),
  computedAt: z.string(),
});

export type ProviderDependencyProfile = z.infer<typeof ProviderDependencyProfileSchema>;
