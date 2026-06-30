import { z } from "zod";

/** Topical cluster grouping related content themes. */
export type TopicalCluster = {
  clusterId: string;
  name: string;
  primaryKeyword: string;
  relatedKeywords: string[];
  searchIntent: "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";
  priority: number;
};

export const topicalClusterSchema = z.object({
  clusterId: z.string().min(1),
  name: z.string().min(1),
  primaryKeyword: z.string().min(1),
  relatedKeywords: z.array(z.string().min(1)).min(1),
  searchIntent: z.enum(["INFORMATIONAL", "COMMERCIAL", "TRANSACTIONAL", "NAVIGATIONAL"]),
  priority: z.number().int().min(1),
});

/** Validates a TopicalCluster record shape. */
export function validateTopicalCluster(value: unknown): TopicalCluster {
  return topicalClusterSchema.parse(value);
}
