import type { ArchitectureConstraintArticle } from "../models/architecture-constraint.js";

function constraint(
  sequence: number,
  constraintId: string,
  title: string,
  statement: string,
  category: ArchitectureConstraintArticle["category"],
  boundModule: string | null = null,
): ArchitectureConstraintArticle {
  return Object.freeze({
    constraintId,
    sequence,
    title,
    statement,
    category,
    boundModule,
    immutable: true as const,
    version: "1.0.0" as const,
  });
}

/** ACD-001 → ACD-030 — Immutable Architecture Constraint Doctrine. NOT runtime logic. */
export const ARCHITECTURE_CONSTRAINT_CATALOG: readonly ArchitectureConstraintArticle[] = Object.freeze([
  constraint(1, "ACD-001", "Modular Architecture", "Architecture must be modular.", "modularity"),
  constraint(2, "ACD-002", "Single Primary Responsibility", "Every module has exactly one primary responsibility.", "modularity"),
  constraint(3, "ACD-003", "No Business Logic In UI", "Business logic must never live inside UI.", "modularity", "frontend"),
  constraint(4, "ACD-004", "No Duplicated Business Logic", "Business logic must never be duplicated.", "modularity"),
  constraint(5, "ACD-005", "Public Contracts", "Every module must expose public contracts.", "contracts"),
  constraint(6, "ACD-006", "Defined Inputs", "Every module must define its inputs.", "contracts"),
  constraint(7, "ACD-007", "Defined Outputs", "Every module must define its outputs.", "contracts"),
  constraint(8, "ACD-008", "Explicit Dependencies", "Dependencies must always be explicit.", "dependencies", "connector-registry"),
  constraint(9, "ACD-009", "No Hidden Dependencies", "Hidden dependencies are forbidden.", "dependencies", "module-routes"),
  constraint(10, "ACD-010", "No Circular Dependencies", "Circular dependencies are forbidden.", "dependencies"),
  constraint(11, "ACD-011", "Runtime Health", "Every runtime must expose health.", "runtime_surface"),
  constraint(12, "ACD-012", "Runtime Status", "Every runtime must expose status.", "runtime_surface"),
  constraint(13, "ACD-013", "Runtime Readiness", "Every runtime must expose readiness.", "runtime_surface", "commerce-readiness-engine"),
  constraint(14, "ACD-014", "Runtime Blockers", "Every runtime must expose blockers.", "runtime_surface", "commerce-readiness-engine"),
  constraint(15, "ACD-015", "Runtime Version", "Every runtime must expose version.", "runtime_surface"),
  constraint(16, "ACD-016", "Shared Models Never Diverge", "Shared models must never diverge.", "shared_intelligence"),
  constraint(17, "ACD-017", "Reuse Shared Intelligence", "Shared intelligence must always be reused.", "shared_intelligence", "empire-knowledge"),
  constraint(18, "ACD-018", "One Capability One Owner", "One capability. One owner.", "ownership", "connector-registry"),
  constraint(19, "ACD-019", "Published API Surface", "Every module must publish its API surface.", "ownership"),
  constraint(20, "ACD-020", "Declare Non-Ownership", "Every module must declare what it does NOT own.", "ownership"),
  constraint(21, "ACD-021", "Future Marketplaces", "Architecture must support future marketplaces without redesign.", "extensibility", "global-marketplace-adapter-framework"),
  constraint(22, "ACD-022", "Future Suppliers", "Architecture must support future suppliers without redesign.", "extensibility", "supplier-connector-framework"),
  constraint(23, "ACD-023", "Future AI Models", "Architecture must support future AI models without redesign.", "extensibility", "brain"),
  constraint(24, "ACD-024", "Future Payment Providers", "Architecture must support future payment providers without redesign.", "extensibility", "live-payment-engine"),
  constraint(25, "ACD-025", "Future Countries", "Architecture must support future countries without redesign.", "extensibility", "country-difference-engine"),
  constraint(26, "ACD-026", "Adapters Isolate Complexity", "Adapters must isolate third-party complexity.", "adapters", "connector-registry"),
  constraint(27, "ACD-027", "Provider-Independent Intelligence", "Core intelligence must remain provider-independent.", "adapters", "supplier-intelligence"),
  constraint(28, "ACD-028", "No Direct Supplier Dependency", "No module may directly depend on supplier implementation.", "adapters", "supplier-connector-framework"),
  constraint(29, "ACD-029", "No Direct Marketplace Dependency", "No module may directly depend on marketplace implementation.", "adapters", "marketplace-publishing"),
  constraint(30, "ACD-030", "Validated During Empire Review", "Architecture constraints must be validated during Empire Review.", "review", "empire-self-inspection"),
]);

export function getArchitectureConstraint(constraintId: string): ArchitectureConstraintArticle | undefined {
  return ARCHITECTURE_CONSTRAINT_CATALOG.find((c) => c.constraintId === constraintId);
}

export function listArchitectureConstraints(): ArchitectureConstraintArticle[] {
  return [...ARCHITECTURE_CONSTRAINT_CATALOG];
}
