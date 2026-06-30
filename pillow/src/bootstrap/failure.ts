import type { BootstrapFailure, LoadedArtifact } from "./types.js";

export function buildBootstrapFailure(
  code: BootstrapFailure["code"],
  message: string,
  missingMandatory: string[],
  selfAssessment?: BootstrapFailure["selfAssessment"],
): BootstrapFailure {
  const recommendations = missingMandatory.map((id) =>
    correctiveActionFor(id),
  );

  if (code === "EXECUTIVE_SELF_ASSESSMENT_FAILED") {
    recommendations.unshift(
      "Executive Self-Assessment failed — Pillow cannot establish coherent executive identity from reconstructed repository knowledge.",
    );
    if (selfAssessment?.failures.length) {
      for (const failure of selfAssessment.failures) {
        recommendations.push(`Resolve self-assessment gap: ${failure}`);
      }
    }
  }

  if (missingMandatory.length > 0) {
    recommendations.unshift(
      "Complete repository reconstruction — restore missing mandatory canonical categories before starting Pillow.",
    );
  }

  if (code === "REPOSITORY_ROOT_INVALID") {
    recommendations.unshift(
      "Run Pillow from inside the EmpireAI repository or pass an explicit repositoryRoot option pointing to the monorepo root containing JOURNEY.md and PILLOW_ARCHITECTURE_CONTRACT.md.",
    );
  }

  return {
    code,
    message,
    missingMandatory,
    recommendations,
    selfAssessment,
  };
}

function correctiveActionFor(categoryOrId: string): string {
  switch (categoryOrId) {
    case "Constitution":
    case "constitution":
      return "Add EMPIREAI_CONSTITUTION.md — permanent engineering law.";
    case "Journey map + audit":
    case "journey":
      return "Add JOURNEY.md and JOURNEY_AUDIT.md — living operational map.";
    case "Implementation contracts":
      return "Ensure UX_IMPLEMENTATION_CONTRACT.md and PILLOW_ARCHITECTURE_CONTRACT.md exist.";
    case "Executive component contract":
      return "Ensure frontend/src/components/system/index.ts exports executive/system components.";
    case "Backlog release artifacts":
      return "Complete backlog release synchronization (BL validation reports).";
    default:
      return `Restore mandatory reconstruction category "${categoryOrId}" per Repository Governance.`;
  }
}

export function collectMissingMandatory(
  artifacts: LoadedArtifact[],
): string[] {
  const missing = new Set<string>();

  for (const artifact of artifacts) {
    if (artifact.descriptor.requirement !== "mandatory") continue;
    if (artifact.present) continue;

    // Global component contract satisfied by UX contract excerpt
    if (artifact.descriptor.satisfiedBy) {
      const uxContract = artifacts.find((a) => a.descriptor.id === "ux_contract");
      if (uxContract?.present) {
        continue;
      }
    }

    missing.add(artifact.descriptor.id);
  }

  return [...missing].sort();
}

export function formatFailureReport(failure: BootstrapFailure): string {
  const lines = [
    "══════════════════════════════════════════════════════════",
    "  PILLOW REPOSITORY RECONSTRUCTION FAILURE",
    "══════════════════════════════════════════════════════════",
    "",
    `Code: ${failure.code}`,
    `Message: ${failure.message}`,
    "",
  ];

  if (failure.missingMandatory.length > 0) {
    lines.push("Missing mandatory reconstruction categories:");
    for (const id of failure.missingMandatory) {
      lines.push(`  • ${id}`);
    }
    lines.push("");
  }

  lines.push("Recommended corrective actions:");
  for (const rec of failure.recommendations) {
    lines.push(`  → ${rec}`);
  }

  lines.push("");
  lines.push(
    "Pillow refuses operational reasoning until repository reconstruction reaches Executive Ready (including Executive Self-Assessment).",
  );

  return lines.join("\n");
}
