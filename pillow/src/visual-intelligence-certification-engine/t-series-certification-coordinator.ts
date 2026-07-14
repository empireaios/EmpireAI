/** T5-10 — T-Series programme certification coordinator. */

import { T1CapabilityValidator } from "./t1-capability-validator.js";
import { T2CapabilityValidator } from "./t2-capability-validator.js";
import { T3CapabilityValidator } from "./t3-capability-validator.js";
import { T4CapabilityValidator } from "./t4-capability-validator.js";
import { T5CapabilityValidator } from "./t5-capability-validator.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import type {
  CertifiedProgramme,
  MissionValidationResult,
  ProgrammeValidationResult,
  VisualIntelligenceEngineBundle,
} from "./types.js";

export class TSeriesCertificationCoordinator {
  private readonly t1 = new T1CapabilityValidator();
  private readonly t2 = new T2CapabilityValidator();
  private readonly t3 = new T3CapabilityValidator();
  private readonly t4 = new T4CapabilityValidator();
  private readonly t5 = new T5CapabilityValidator();

  async validateProgrammes(
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
    scope: CertifiedProgramme[],
  ): Promise<ProgrammeValidationResult[]> {
    const results: ProgrammeValidationResult[] = [];

    if (scope.includes("T1")) {
      results.push(await this.t1.validate(engines.visualFoundationCertification, config));
    }
    if (scope.includes("T2")) {
      results.push(await this.t2.validate(engines.uxIntelligenceCertification, config));
    }
    if (scope.includes("T3")) {
      results.push(await this.t3.validate(engines.autonomousBuilderCertification, config));
    }
    if (scope.includes("T4")) {
      results.push(await this.t4.validate(engines.executiveCollaborationCertification, config));
    }
    if (scope.includes("T5")) {
      const t5Missions = this.t5.validateAll(engines, config);
      const passed = t5Missions.filter((m) => m.passed).length;
      results.push({
        programmeId: "T5",
        programmeName: "Autonomous Evolution",
        passed: passed === t5Missions.length,
        healthStatus: passed === t5Missions.length ? "healthy" : "degraded",
        readinessScore: Math.round((passed / t5Missions.length) * 100),
        missionsValidated: t5Missions.length,
        missionsPassed: passed,
        details: t5Missions.map((m) => `${m.missionId}: ${m.passed ? "pass" : "fail"}`),
        warnings: t5Missions.flatMap((m) => m.warnings.map((w) => `${m.missionId}: ${w}`)),
        errors: t5Missions.flatMap((m) => m.errors.map((e) => `${m.missionId}: ${e}`)),
        evidenceReferences: t5Missions.flatMap((m) => m.evidenceReferences),
        durationMs: t5Missions.reduce((s, m) => s + m.durationMs, 0),
      });
    }

    return results;
  }

  validateT5Missions(
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ): MissionValidationResult[] {
    return this.t5.validateAll(engines, config);
  }
}
