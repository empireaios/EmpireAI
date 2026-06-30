import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  AUDIT_SEVERITIES,
  EMPIRE_AUDIT_SIGNAL_TYPES,
  ISSUE_CATEGORIES,
  MISSION_PHASES,
  READINESS_TIERS,
  RECOMMENDATION_PRIORITIES,
  createEmpireAuditIntelligenceModule,
  createInMemoryEmpireAuditIntelligenceRepository,
  generateEmpireAudit,
  validateEmpireAuditReport,
  validateEmpireAuditRecord,
  validateNextMissionsRoadmap,
} from "../../execution/empire-audit-intelligence/index.js";

const WORKSPACE_ID = "ws-m100";

function buildAuditInput(workspaceId = WORKSPACE_ID) {
  return {
    workspaceId,
    reportName: "EmpireAI Complete Audit",
    auditIndex: 88,
    moduleCount: 100,
    testCoveragePercent: 75,
  };
}

describe("Mission 100 Empire Audit Intelligence Engine", () => {
  it("generates audit report with safety flags", async () => {
    const module = createEmpireAuditIntelligenceModule();
    const record = await module.persistAudit(buildAuditInput());

    assert.ok(record.reportId);
    assert.equal(record.reportName, "EmpireAI Complete Audit");
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoRemediateEnabled, false);
    assert.ok(record.confidence >= 50);
    assert.ok(record.overallScore >= 0 && record.overallScore <= 100);
    assert.ok(record.signals.some((signal) => signal.signalType === "audit_composite"));
  });

  it("audits all eight review dimensions", () => {
    const report = generateEmpireAudit(buildAuditInput());
    const dimensions = [
      report.architecture,
      report.security,
      report.scalability,
      report.performance,
      report.reliability,
      report.businessReadiness,
      report.deploymentReadiness,
      report.launchReadiness,
    ];

    assert.equal(dimensions.length, 8);
    for (const dimension of dimensions) {
      assert.ok(dimension.dimensionId.length > 0);
      assert.ok(AUDIT_SEVERITIES.includes(dimension.severity));
      assert.ok(dimension.score >= 0 && dimension.score <= 100);
      assert.ok(dimension.findings.length >= 1);
      assert.ok(dimension.summary.length > 0);
    }
  });

  it("identifies critical issues with remediation guidance", () => {
    const { criticalIssues } = generateEmpireAudit(buildAuditInput());

    assert.ok(criticalIssues.length >= 1);
    for (const issue of criticalIssues) {
      assert.ok(ISSUE_CATEGORIES.includes(issue.category));
      assert.ok(AUDIT_SEVERITIES.includes(issue.severity));
      assert.ok(issue.title.length > 0);
      assert.ok(issue.remediation.length > 0);
      assert.ok(issue.impact.length > 0);
    }
  });

  it("produces prioritized recommendations", () => {
    const { recommendations } = generateEmpireAudit(buildAuditInput());

    assert.ok(recommendations.length >= 5);
    for (const recommendation of recommendations) {
      assert.ok(RECOMMENDATION_PRIORITIES.includes(recommendation.priority));
      assert.ok(recommendation.title.length > 0);
      assert.ok(recommendation.expectedImpact.length > 0);
      assert.ok(recommendation.effortLevel.length > 0);
      assert.ok(recommendation.score >= 0 && recommendation.score <= 100);
    }
  });

  it("computes empire readiness score with tier", () => {
    const { empireReadinessScore } = generateEmpireAudit(buildAuditInput());

    assert.ok(READINESS_TIERS.includes(empireReadinessScore.tier));
    assert.ok(empireReadinessScore.overallScore >= 0 && empireReadinessScore.overallScore <= 100);
    assert.equal(Object.keys(empireReadinessScore.dimensionScores).length, 8);
    assert.ok(empireReadinessScore.headline.includes("Empire Readiness Score"));
    assert.ok(empireReadinessScore.summary.length > 0);
  });

  it("generates next 100 missions roadmap (M101–M200)", () => {
    const { nextMissions } = generateEmpireAudit(buildAuditInput());

    validateNextMissionsRoadmap(nextMissions);
    assert.equal(nextMissions.startMission, 101);
    assert.equal(nextMissions.endMission, 200);
    assert.equal(nextMissions.missions.length, 100);

    for (const mission of nextMissions.missions) {
      assert.ok(mission.missionNumber >= 101 && mission.missionNumber <= 200);
      assert.ok(MISSION_PHASES.includes(mission.phase));
      assert.ok(mission.missionTitle.startsWith(`M${mission.missionNumber}:`));
      assert.ok(mission.description.length > 0);
    }

    const phases = new Set(nextMissions.missions.map((m) => m.phase));
    assert.ok(phases.has("FOUNDATION"));
    assert.ok(phases.has("INTELLIGENCE"));
    assert.ok(phases.has("EXECUTION"));
    assert.ok(phases.has("AUTONOMY"));
    assert.ok(phases.has("SCALE"));
  });

  it("emits audit signals for all dimensions", () => {
    const { signals } = generateEmpireAudit(buildAuditInput());

    assert.ok(signals.length >= 8);
    for (const signal of signals) {
      assert.ok(EMPIRE_AUDIT_SIGNAL_TYPES.includes(signal.signalType));
      assert.ok(signal.score >= 0 && signal.score <= 100);
      assert.ok(signal.weight >= 0 && signal.weight <= 1);
      assert.ok(signal.detail.length > 0);
    }
  });

  it("validates report schema", () => {
    const report = generateEmpireAudit(buildAuditInput());
    const validated = validateEmpireAuditReport({ reportId: randomUUID(), ...report });

    assert.equal(validated.workspaceId, WORKSPACE_ID);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.deploymentEnabled, false);
  });

  it("persists and retrieves audit record by workspace", async () => {
    const repository = createInMemoryEmpireAuditIntelligenceRepository();
    const module = createEmpireAuditIntelligenceModule(repository);

    const saved = await module.persistAudit(buildAuditInput());
    validateEmpireAuditRecord(saved);

    const retrieved = await module.getAuditByWorkspace(WORKSPACE_ID);
    assert.ok(retrieved);
    assert.equal(retrieved.recordId, saved.recordId);
    assert.equal(retrieved.overallScore, saved.overallScore);
  });

  it("lists audit records for workspace", async () => {
    const repository = createInMemoryEmpireAuditIntelligenceRepository();
    const module = createEmpireAuditIntelligenceModule(repository);

    await module.persistAudit(buildAuditInput());
    const records = await module.listAuditRecords({ workspaceId: WORKSPACE_ID });

    assert.equal(records.length, 1);
    assert.equal(records[0]?.workspaceId, WORKSPACE_ID);
  });

  it("updates existing workspace audit on re-persist", async () => {
    const repository = createInMemoryEmpireAuditIntelligenceRepository();
    const module = createEmpireAuditIntelligenceModule(repository);

    const first = await module.persistAudit(buildAuditInput());
    const second = await module.persistAudit({
      ...buildAuditInput(),
      auditIndex: 95,
    });

    assert.equal(first.recordId, second.recordId);
    assert.ok(second.overallScore >= first.overallScore);
  });
});
