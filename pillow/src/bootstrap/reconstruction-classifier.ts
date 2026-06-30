import type { IntelligenceClassification } from "../intelligence/types.js";
import { classifyByPath } from "../intelligence/classifier.js";
import type { ArtifactCategory, ArtifactDescriptor, ArtifactRequirement } from "./types.js";

/** Map discovered path classification → bootstrap artifact category. */
export function mapToArtifactCategory(
  relativePath: string,
  classification: IntelligenceClassification,
): ArtifactCategory {
  const base = relativePath.split(/[/\\]/).pop() ?? relativePath;

  if (/^EMPIREAI_SOUL\.md$/i.test(base)) return "soul";
  if (/^EMPIREAI_STATUS\.md$/i.test(base)) return "project_state";
  if (/^EMPIREAI_DECISIONS\.md$/i.test(base)) return "decision_register";
  if (/^JOURNEY\.md$/i.test(base)) return "journey";
  if (/^JOURNEY_AUDIT\.md$/i.test(base)) return "journey";
  if (/^EMPIREAI_CONSTITUTION\.md$/i.test(base)) return "constitution";
  if (/^UX_IMPLEMENTATION_CONTRACT\.md$/i.test(base)) return "implementation_contract";
  if (/^PILLOW_ARCHITECTURE_CONTRACT\.md$/i.test(base)) return "implementation_contract";
  if (/components\/system\/index\.(ts|tsx)$/i.test(relativePath)) return "component_contract";
  if (/UX_ENHANCEMENT_REGISTER|PILLOW_ENHANCEMENT_REGISTER/i.test(relativePath)) {
    return "ux_enhancement";
  }
  if (/VALIDATION_REPORT|^BL-[A-C]\.md$/i.test(base)) return "backlog_release";
  if (/EXECUTIVE_AUDIT|DIFFERENCE_REPORT|COMBINED_EXECUTIVE_AUDIT/i.test(base)) {
    return "executive_audit";
  }
  if (/^EMPIREAI_.*_DOCTRINE\.md$/i.test(base) || /RECOVERY/i.test(base)) {
    return "doctrine";
  }
  if (/^EMPIREAI_(BACKLOG|EXECUTIVE|REPOSITORY|JOURNEY)/i.test(base)) {
    return "repository_governance";
  }

  switch (classification) {
    case "constitution":
      return "constitution";
    case "journey":
    case "journey_audit":
      return "journey";
    case "doctrine":
    case "architecture":
      return "doctrine";
    case "contract":
      return "implementation_contract";
    case "executive_component":
      return "component_contract";
    case "backlog":
      return "backlog_release";
    case "decision":
      return "decision_register";
    case "operational_document":
      return "project_state";
    case "executive_audit":
      return "executive_audit";
    case "enhancement_register":
      return "ux_enhancement";
    case "governance":
      return "repository_governance";
    default:
      return "repository_governance";
  }
}

export function descriptorFromPath(relativePath: string): ArtifactDescriptor {
  const classification = classifyByPath(relativePath);
  const category = mapToArtifactCategory(relativePath, classification);
  const base = relativePath.split(/[/\\]/).pop() ?? relativePath;
  const id = base
    .replace(/\.(md|ts|tsx)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  let requirement: ArtifactRequirement = "optional";
  if (
    category === "ux_enhancement" ||
    category === "executive_audit" ||
    /BL-C\.md$/i.test(base) ||
    /RECOVERY/i.test(base)
  ) {
    requirement = "optional";
  } else if (category !== "real_owner") {
    requirement = "mandatory";
  }

  const descriptor: ArtifactDescriptor = {
    id: id || "discovered_source",
    category,
    requirement,
    relativePath,
    description: `Discovered canonical source (${category})`,
  };

  if (
    category === "component_contract" &&
    relativePath.includes("UX_IMPLEMENTATION_CONTRACT")
  ) {
    descriptor.satisfiedBy = "UX_IMPLEMENTATION_CONTRACT.md#part-2-global-components";
  }

  return descriptor;
}
