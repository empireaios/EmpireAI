import type { LoadedArtifact } from "./types.js";
import {
  RECONSTRUCTION_CATEGORY_RULES,
  type CategoryCompletenessRule,
} from "./reconstruction-rules.js";

export interface CompletenessReport {
  complete: boolean;
  missingCategories: string[];
  categoryCounts: Record<string, number>;
}

/** Verify reconstruction completeness by category — not by fixed file count. */
export function verifyReconstructionCompleteness(
  artifacts: LoadedArtifact[],
): CompletenessReport {
  const present = artifacts.filter((artifact) => artifact.present);
  const categoryCounts: Record<string, number> = {};

  for (const artifact of present) {
    const key = artifact.descriptor.category;
    categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
  }

  const missingCategories: string[] = [];

  for (const rule of RECONSTRUCTION_CATEGORY_RULES) {
    if (rule.requirement !== "mandatory") continue;
    if (isCategorySatisfied(rule, artifacts, categoryCounts)) continue;
    missingCategories.push(rule.label);
  }

  return {
    complete: missingCategories.length === 0,
    missingCategories,
    categoryCounts,
  };
}

function isCategorySatisfied(
  rule: CategoryCompletenessRule,
  artifacts: LoadedArtifact[],
  categoryCounts: Record<string, number>,
): boolean {
  const count = categoryCounts[rule.category] ?? 0;
  if (count >= rule.minPresent) return true;

  if (rule.allowSatisfiedBy && rule.category === "component_contract") {
    const uxContract = artifacts.find(
      (artifact) =>
        artifact.present &&
        artifact.descriptor.relativePath.includes("UX_IMPLEMENTATION_CONTRACT"),
    );
    const executiveIndex = artifacts.find(
      (artifact) =>
        artifact.present &&
        artifact.descriptor.category === "component_contract" &&
        artifact.descriptor.relativePath.includes("components/system"),
    );
    if (uxContract?.present && executiveIndex?.present) return true;
    if (uxContract?.present) return true;
  }

  return false;
}

/** Validate integrity of discovered sources (readable, non-empty when mandatory). */
export function validateSourceIntegrity(artifacts: LoadedArtifact[]): string[] {
  const issues: string[] = [];

  for (const artifact of artifacts) {
    if (!artifact.present) {
      if (artifact.descriptor.requirement === "mandatory") {
        issues.push(`Missing mandatory source: ${artifact.descriptor.relativePath}`);
      }
      continue;
    }

    if (artifact.sizeBytes === 0) {
      issues.push(`Empty source: ${artifact.descriptor.relativePath}`);
    }
  }

  return issues;
}

/** Resolve dependency aliases (e.g. GC contract satisfied by UX contract). */
export function resolveReconstructionDependencies(
  artifacts: LoadedArtifact[],
): LoadedArtifact[] {
  const uxContract = artifacts.find(
    (artifact) =>
      artifact.present &&
      artifact.descriptor.relativePath === "UX_IMPLEMENTATION_CONTRACT.md",
  );

  return artifacts.map((artifact) => {
    if (
      !artifact.present &&
      artifact.descriptor.satisfiedBy &&
      uxContract?.present
    ) {
      return {
        ...artifact,
        present: true,
        excerpt: uxContract.excerpt,
        sizeBytes: uxContract.sizeBytes,
        modifiedAt: uxContract.modifiedAt,
      };
    }
    return artifact;
  });
}

export function collectMissingMandatoryCategories(report: CompletenessReport): string[] {
  return report.missingCategories;
}
