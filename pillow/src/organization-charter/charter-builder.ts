import type { OrganizationCharterConfiguration } from "./configuration.js";
import { CHARTER_VERSION, OCH_METADATA_VERSION } from "./paths.js";
import type {
  DepartmentDefinition,
  FactoryDefinition,
  OrganizationCharterDefinition,
  OrganizationCharterInput,
  StructureDecision,
  WorkerOwnership,
} from "./types.js";

export type OrganizationEvaluation = {
  charter: OrganizationCharterDefinition;
  structureDecision: StructureDecision;
  factoriesRegistered: string[];
  departmentsRegistered: string[];
  workersRegistered: string[];
  reportingValidated: boolean;
  escalationValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Organization Charter definition and hierarchy helpers for Q1-02. */
export class CharterBuilder {
  define(
    config: OrganizationCharterConfiguration,
    state: {
      factories: FactoryDefinition[];
      departments: DepartmentDefinition[];
      workers: WorkerOwnership[];
    },
  ): OrganizationCharterDefinition {
    const factories = state.factories.map((f) => ({
      ...f,
      responsibilities: [...f.responsibilities],
      reportsTo: "pillow" as const,
    }));
    const departments = state.departments.map((d) => ({
      ...d,
      responsibilities: [...d.responsibilities],
    }));
    const workers = state.workers.map((w) => ({ ...w }));

    const reportingRelationships = [
      ...factories.map((f) => ({
        fromId: f.factoryId,
        toId: "pillow",
        relationship: "reports_to" as const,
      })),
      ...departments.map((d) => ({
        fromId: d.departmentId,
        toId: d.factoryId,
        relationship: "reports_to" as const,
      })),
      ...workers.map((w) => ({
        fromId: w.workerId,
        toId: w.departmentId,
        relationship: "reports_to" as const,
      })),
    ];

    const responsibilityMatrix = [
      {
        responsibilityId: "executive_authority",
        ownerId: "pillow",
        ownerType: "pillow" as const,
        description: "Sole executive authority over the AI Workforce organization",
      },
      ...factories.flatMap((f) =>
        f.responsibilities.map((r) => ({
          responsibilityId: `${f.factoryId}:${r}`,
          ownerId: f.factoryId,
          ownerType: "factory" as const,
          description: r,
        })),
      ),
      ...departments.flatMap((d) =>
        d.responsibilities.map((r) => ({
          responsibilityId: `${d.departmentId}:${r}`,
          ownerId: d.departmentId,
          ownerType: "department" as const,
          description: r,
        })),
      ),
    ];

    const escalationHierarchy = [
      { level: 1, actorId: "worker", actorType: "worker" },
      { level: 2, actorId: "department", actorType: "department" },
      { level: 3, actorId: "factory", actorType: "factory" },
      { level: 4, actorId: "pillow", actorType: "pillow" },
    ];

    return {
      charterVersion: config.charterVersion || CHARTER_VERSION,
      executiveAuthority: "pillow",
      organizationalHierarchy: [
        "pillow",
        "factory",
        "department",
        "worker",
      ],
      departments,
      factories,
      reportingRelationships,
      authorityLevels: [...config.authorityLevels],
      responsibilityMatrix,
      escalationHierarchy,
      governanceRules: [...config.governanceRules],
      metadataVersion: OCH_METADATA_VERSION,
      collaborationRules: [...config.collaborationRules],
      organizationalRules: [...config.organizationalRules],
      workerOwnership: workers,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOperatingSystem: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: OrganizationCharterInput,
    config: OrganizationCharterConfiguration,
    state: {
      factories: FactoryDefinition[];
      departments: DepartmentDefinition[];
      workers: WorkerOwnership[];
    },
  ): OrganizationEvaluation {
    const charter = this.define(config, state);
    const rules = unique(input.rules ?? config.organizationalRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];

    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, charter, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const reportingValidated =
      !failed.includes("factory_reports_to_pillow") &&
      !failed.includes("worker_has_reporting_chain") &&
      !failed.includes("department_belongs_to_one_factory");
    const escalationValidated =
      !failed.includes("escalation_reaches_pillow") &&
      charter.escalationHierarchy.some((s) => s.actorId === "pillow");

    let structureDecision: StructureDecision = "valid";
    if (failed.length === 0) structureDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) {
      structureDecision = "partially_valid";
    } else structureDecision = "invalid";

    return {
      charter,
      structureDecision,
      factoriesRegistered: charter.factories.map((f) => f.factoryId),
      departmentsRegistered: charter.departments.map((d) => d.departmentId),
      workersRegistered: charter.workerOwnership.map((w) => w.workerId),
      reportingValidated,
      escalationValidated,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: OrganizationCharterInput,
    charter: OrganizationCharterDefinition,
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "pillow_supreme_executive_authority":
        return (
          input.pillowIsSupremeAuthority !== false &&
          charter.executiveAuthority === "pillow" &&
          input.overridePillow !== true
        );
      case "worker_belongs_to_exactly_one_department": {
        const counts = new Map<string, number>();
        for (const w of charter.workerOwnership) {
          counts.set(w.workerId, (counts.get(w.workerId) ?? 0) + 1);
        }
        return [...counts.values()].every((n) => n === 1);
      }
      case "department_belongs_to_one_factory":
        return charter.departments.every((d) =>
          charter.factories.some((f) => f.factoryId === d.factoryId),
        );
      case "factory_reports_to_pillow":
        return charter.factories.every((f) => f.reportsTo === "pillow");
      case "worker_has_reporting_chain":
        return charter.workerOwnership.every((w) => {
          const dept = charter.departments.find((d) => d.departmentId === w.departmentId);
          if (!dept) return false;
          return charter.factories.some((f) => f.factoryId === dept.factoryId);
        });
      case "responsibility_has_owner":
        return charter.responsibilityMatrix.every((r) => !!r.ownerId);
      case "escalation_reaches_pillow":
        return charter.escalationHierarchy.some(
          (s) => s.actorId === "pillow" || s.actorType === "pillow",
        );
      case "no_worker_outside_organization":
        return charter.workerOwnership.every((w) =>
          charter.departments.some((d) => d.departmentId === w.departmentId),
        );
      default:
        return true;
    }
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
