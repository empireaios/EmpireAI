import type { LaunchPlan } from "./types.js";

/** Authoritative in-memory Launch Plan store — planning only. */
export class PlanStore {
  private plans = new Map<string, LaunchPlan>();
  private latestPlanId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    launchPlanId: string;
    action: string;
    details: string;
  }> = [];

  seed(plans: LaunchPlan[]) {
    this.plans.clear();
    this.latestPlanId = null;
    this.auditTrail = [];
    for (const plan of plans) {
      this.plans.set(plan.launchPlanId, clone(plan));
      this.latestPlanId = plan.launchPlanId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        launchPlanId: plan.launchPlanId,
        action: "seed",
        details: `seeded launch plan for mission=${plan.businessBuildMissionId}`,
      });
    }
  }

  count() {
    return this.plans.size;
  }

  list() {
    return [...this.plans.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(launchPlanId: string) {
    const plan = this.plans.get(launchPlanId);
    return plan ? clone(plan) : null;
  }

  getLatestPlanId() {
    return this.latestPlanId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(plan: LaunchPlan, action = "save") {
    for (const [id, existing] of this.plans) {
      if (
        existing.businessBuildMissionId === plan.businessBuildMissionId &&
        id !== plan.launchPlanId
      ) {
        this.plans.delete(id);
        this.auditTrail.push({
          timestamp: new Date().toISOString(),
          launchPlanId: id,
          action: "supersede",
          details: `superseded_by=${plan.launchPlanId}`,
        });
      }
    }
    this.plans.set(plan.launchPlanId, clone(plan));
    this.latestPlanId = plan.launchPlanId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      launchPlanId: plan.launchPlanId,
      action,
      details: `stages=${plan.launchStages.length} tasks=${plan.tasks.length} milestones=${plan.milestones.length}`,
    });
    return clone(plan);
  }

  markSubmitted(
    launchPlanId: string,
    refs: {
      executiveReportId: string;
      missionCoordinationRef?: string | null;
      approvalRouterRef?: string | null;
    },
  ) {
    const current = this.plans.get(launchPlanId);
    if (!current) return null;
    const updated: LaunchPlan = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId: refs.executiveReportId,
      missionCoordinationRef:
        refs.missionCoordinationRef ?? current.missionCoordinationRef,
      approvalRouterRef: refs.approvalRouterRef ?? current.approvalRouterRef,
    };
    return this.saveCanonical(updated, "submit_launch_plan");
  }
}

function clone(plan: LaunchPlan): LaunchPlan {
  return {
    ...plan,
    launchStages: plan.launchStages.map((s) => ({
      ...s,
      dependsOnStages: [...s.dependsOnStages],
      derivedFrom: [...s.derivedFrom],
    })),
    milestones: plan.milestones.map((m) => ({
      ...m,
      measurableCriteria: [...m.measurableCriteria],
      dependsOn: [...m.dependsOn],
    })),
    tasks: plan.tasks.map((t) => ({
      ...t,
      dependsOn: [...t.dependsOn],
      requiredTools: [...t.requiredTools],
    })),
    dependencies: plan.dependencies.map((d) => ({ ...d })),
    requiredWorkforce: plan.requiredWorkforce.map((w) => ({
      ...w,
      skills: [...w.skills],
    })),
    requiredTools: [...plan.requiredTools],
    approvalCheckpoints: plan.approvalCheckpoints.map((c) => ({
      ...c,
      requiredEvidence: [...c.requiredEvidence],
    })),
    validationCheckpoints: plan.validationCheckpoints.map((c) => ({
      ...c,
      requiredEvidence: [...c.requiredEvidence],
    })),
    launchPrerequisites: [...plan.launchPrerequisites],
    blockers: plan.blockers.map((b) => ({ ...b, blocks: [...b.blocks] })),
    rollbackConditions: plan.rollbackConditions.map((r) => ({ ...r })),
    completionCriteria: [...plan.completionCriteria],
    missingPrerequisites: [...plan.missingPrerequisites],
    preservedDecisions: [...plan.preservedDecisions],
    traceabilityRefs: [...plan.traceabilityRefs],
  };
}
