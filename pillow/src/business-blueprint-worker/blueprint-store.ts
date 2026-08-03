import type { BusinessBlueprint } from "./types.js";

/** Authoritative in-memory Business Blueprint store — blueprint only. */
export class BlueprintStore {
  private blueprints = new Map<string, BusinessBlueprint>();
  private latestBlueprintId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    blueprintId: string;
    action: string;
    details: string;
  }> = [];

  seed(blueprints: BusinessBlueprint[]) {
    this.blueprints.clear();
    this.latestBlueprintId = null;
    this.auditTrail = [];
    for (const blueprint of blueprints) {
      this.blueprints.set(blueprint.blueprintId, clone(blueprint));
      this.latestBlueprintId = blueprint.blueprintId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        blueprintId: blueprint.blueprintId,
        action: "seed",
        details: `seeded blueprint for mission=${blueprint.businessBuildMissionId}`,
      });
    }
  }

  count() {
    return this.blueprints.size;
  }

  list() {
    return [...this.blueprints.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(blueprintId: string) {
    const blueprint = this.blueprints.get(blueprintId);
    return blueprint ? clone(blueprint) : null;
  }

  getLatestBlueprintId() {
    return this.latestBlueprintId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  /** Canonical: replace prior blueprints for the same mission with the new one. */
  saveCanonical(blueprint: BusinessBlueprint, action = "save") {
    for (const [id, existing] of this.blueprints) {
      if (
        existing.businessBuildMissionId === blueprint.businessBuildMissionId &&
        id !== blueprint.blueprintId
      ) {
        this.blueprints.delete(id);
        this.auditTrail.push({
          timestamp: new Date().toISOString(),
          blueprintId: id,
          action: "supersede",
          details: `superseded_by=${blueprint.blueprintId}`,
        });
      }
    }
    this.blueprints.set(blueprint.blueprintId, clone(blueprint));
    this.latestBlueprintId = blueprint.blueprintId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      blueprintId: blueprint.blueprintId,
      action,
      details: `type=${blueprint.businessType} workers=${blueprint.requiredWorkers.length} milestones=${blueprint.milestones.length}`,
    });
    return clone(blueprint);
  }

  markSubmitted(blueprintId: string, executiveReportId: string) {
    const current = this.blueprints.get(blueprintId);
    if (!current) return null;
    const updated: BusinessBlueprint = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveCanonical(updated, "submit_blueprint");
  }
}

function clone(blueprint: BusinessBlueprint): BusinessBlueprint {
  return {
    ...blueprint,
    productsServices: [...blueprint.productsServices],
    customerSegments: [...blueprint.customerSegments],
    requiredIntegrations: [...blueprint.requiredIntegrations],
    requiredAssets: [...blueprint.requiredAssets],
    preservedDecisions: [...blueprint.preservedDecisions],
    traceabilityRefs: [...blueprint.traceabilityRefs],
    operationalWorkflow: blueprint.operationalWorkflow.map((s) => ({
      ...s,
      dependsOn: [...s.dependsOn],
    })),
    requiredWorkers: blueprint.requiredWorkers.map((w) => ({
      ...w,
      skills: [...w.skills],
    })),
    milestones: blueprint.milestones.map((m) => ({
      ...m,
      dependsOn: [...m.dependsOn],
      successCriteria: [...m.successCriteria],
    })),
    dependencies: blueprint.dependencies.map((d) => ({
      ...d,
      blocks: [...d.blocks],
    })),
    businessArchitecture: {
      ...blueprint.businessArchitecture,
      deliveryChannels: [...blueprint.businessArchitecture.deliveryChannels],
      customerProblemsAddressed: [
        ...blueprint.businessArchitecture.customerProblemsAddressed,
      ],
    },
  };
}
