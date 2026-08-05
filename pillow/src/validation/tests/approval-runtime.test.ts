import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  APVRT_CAPABILITIES,
  APVRT_METADATA_VERSION,
  APVRT_REPORT_VERSION,
  APVRT_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  POLICY_SCOPES,
  buildApprovalRuntimeConfiguration,
  createApprovalRuntime,
  resetApprovalRuntimeForTesting,
  type ApvrtInput,
  type ApprovalRuntimeDependencies,
} from "../../approval-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<ApvrtInput> = {}): ApvrtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: ApprovalRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createApprovalRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-09 Approval Runtime", () => {
  beforeEach(resetApprovalRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildApprovalRuntimeConfiguration(REPO_ROOT, {
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverFabricateApprovalDecisions: false as never,
      neverAutoApproveRestrictedActions: false as never,
      neverImplementQ1010OrLater: false as never,
      neverReplaceBusinessLogic: false as never,
      neverReplaceWorkerImplementations: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      deterministicApprovalRouting: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverFabricateApprovalDecisions, true);
    assert.equal(c.neverAutoApproveRestrictedActions, true);
    assert.equal(c.neverImplementQ1010OrLater, true);
    assert.equal(c.neverReplaceBusinessLogic, true);
    assert.equal(c.neverReplaceWorkerImplementations, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveApprovalHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.preventUnauthorizedExecution, true);
    assert.equal(c.deterministicApprovalRouting, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-APVRT-001 Q10-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-09");
    assert.equal(state.engineVersion, "PILLOW-APVRT-001");
    assert.equal(state.configuration.workerId, "wkr-approval-runtime-01");
    assert.equal(state.configuration.factory, "pillow-approval");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(APVRT_CAPABILITIES.includes("route_approvals_deterministically"));
    assert.ok(APVRT_CAPABILITIES.includes("q1010_consumable_contract"));
    assert.equal(APPROVAL_TYPES.length, 7);
    assert.equal(APPROVAL_STATUSES.length, 11);
    assert.ok(POLICY_SCOPES.includes("high_risk"));
  });

  test("3 policies registered", async () => {
    const engine = await build();
    const listed = engine.list(sampleInput());
    assert.equal(listed.decision, "pass");
    const ids = listed.policies.map((p) => p.policyId);
    assert.ok(ids.includes("pol-pillow-standard"));
    assert.ok(ids.includes("pol-grand-king-restricted"));
    assert.ok(ids.includes("pol-multi-stage-ops"));
    assert.ok(ids.includes("pol-conditional-escalation"));
    assert.ok(ids.includes("pol-delegated-ops"));
    const gk = listed.policies.find((p) => p.policyId === "pol-grand-king-restricted");
    assert.ok(gk);
    assert.equal(gk!.requiresGrandKing, true);
    assert.equal(gk!.highRisk, true);
    assert.deepEqual(gk!.stages, ["pillow", "grand_king"]);
  });

  test("4 approval requests routed correctly", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-pillow-standard",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-alpha",
        auditReference: "audit://apvrt/request/route-01",
      }),
    );
    assert.equal(submitted.decision, "pass");
    assert.ok(submitted.request);
    assert.equal(submitted.request!.currentApprover, "pillow");
    assert.equal(submitted.request!.currentStatus, "awaiting_pillow");
    assert.equal(submitted.request!.fabricated, false);
    assert.equal(submitted.request!.structuralSignalOnly, true);

    const routed = engine.routeApproval(
      sampleInput({ approvalId: submitted.request!.approvalId }),
    );
    assert.equal(routed.decision, "pass");
    assert.equal(routed.request!.currentApprover, "pillow");
  });

  test("5 Pillow approvals enforced", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-pillow-standard",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-alpha",
        auditReference: "audit://apvrt/request/pillow-01",
      }),
    );
    assert.equal(submitted.decision, "pass");

    const wrongApprover = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "not-pillow",
      }),
    );
    assert.equal(wrongApprover.decision, "fail");
    assert.ok(wrongApprover.errors.some((e) => e.toLowerCase().includes("pillow")));

    const approved = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    assert.equal(approved.decision, "pass");
    assert.equal(approved.request!.currentStatus, "approved");
    assert.ok(approved.decisionRecord);
    assert.equal(approved.decisionRecord!.fabricated, false);
  });

  test("6 Grand King approvals enforced", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-grand-king-restricted",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-beta",
        highRisk: true,
        auditReference: "audit://apvrt/request/gk-01",
      }),
    );
    assert.equal(submitted.decision, "pass");
    assert.equal(submitted.request!.currentStatus, "awaiting_pillow");

    const pillowOk = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    assert.equal(pillowOk.decision, "pass");
    assert.equal(pillowOk.request!.currentStatus, "awaiting_grand_king");
    assert.equal(pillowOk.request!.currentApprover, "grand_king");

    const fakeGk = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    assert.equal(fakeGk.decision, "fail");
    assert.ok(fakeGk.errors.some((e) => e.toLowerCase().includes("grand king")));

    const gkOk = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "grand_king",
      }),
    );
    assert.equal(gkOk.decision, "pass");
    assert.equal(gkOk.request!.currentStatus, "approved");
  });

  test("7 multi-stage approvals function", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-multi-stage-ops",
        missionId: "Q10-09",
        factory: "pillow-ops",
        worker: "wkr-gamma",
        approvalType: "multi_stage",
        highRisk: true,
        auditReference: "audit://apvrt/request/multi-01",
      }),
    );
    assert.equal(submitted.decision, "pass");
    assert.deepEqual(submitted.requiredStages, ["pillow", "factory_lead", "grand_king"]);

    const s1 = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    assert.equal(s1.decision, "pass");
    assert.equal(s1.request!.currentApprover, "factory_lead:pillow-ops");
    assert.equal(s1.request!.stageIndex, 1);

    const s2 = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "factory_lead:pillow-ops",
      }),
    );
    assert.equal(s2.decision, "pass");
    assert.equal(s2.request!.currentApprover, "grand_king");
    assert.equal(s2.request!.currentStatus, "awaiting_grand_king");

    const s3 = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "grand_king",
      }),
    );
    assert.equal(s3.decision, "pass");
    assert.equal(s3.request!.currentStatus, "approved");
  });

  test("8 rejections prevent execution/resume", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-pillow-standard",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-delta",
        auditReference: "audit://apvrt/request/reject-01",
      }),
    );
    assert.equal(submitted.decision, "pass");

    const rejected = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "reject",
        approver: "pillow",
      }),
    );
    assert.equal(rejected.decision, "pass");
    assert.equal(rejected.request!.currentStatus, "rejected");

    const resume = engine.resumeExecution(
      sampleInput({ approvalId: submitted.request!.approvalId }),
    );
    assert.equal(resume.decision, "fail");
    assert.ok(resume.errors.some((e) => e.toLowerCase().includes("reject")));
    assert.equal(resume.resumeToken, null);
  });

  test("9 approval history preserved", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-pillow-standard",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-epsilon",
        auditReference: "audit://apvrt/request/hist-01",
      }),
    );
    const approved = engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    assert.equal(approved.decision, "pass");

    const history = engine.getHistory();
    assert.ok(history.requests.some((r) => r.approvalId === submitted.request!.approvalId));
    assert.ok(history.requestHistory.length >= 2);
    assert.ok(history.decisions.some((d) => d.approvalId === submitted.request!.approvalId));
    assert.ok(history.decisionHistory.length >= 1);
    assert.ok(engine.getAuditTrail().some((e) => e.startsWith("request_saved:")));
    assert.ok(engine.getAuditTrail().some((e) => e.startsWith("decision_saved:")));
  });

  test("10 full Approval Runtime Report + consumableByQ1010", async () => {
    const engine = await build();
    const submitted = engine.submitApprovalRequest(
      sampleInput({
        policyId: "pol-pillow-standard",
        missionId: "Q10-09",
        factory: "pillow-approval",
        worker: "wkr-zeta",
        auditReference: "audit://apvrt/request/report-01",
      }),
    );
    engine.decide(
      sampleInput({
        approvalId: submitted.request!.approvalId,
        decision: "approve",
        approver: "pillow",
      }),
    );
    const report = engine.produceReport(sampleInput());
    assert.equal(report.decision, "pass");
    const apvrt = report.approvalRuntimeReport;
    assert.ok(apvrt);
    assert.ok(apvrt!.reportId.startsWith("apvrt-rpt"));
    assert.ok(apvrt!.timestamp);
    assert.equal(apvrt!.runtimeVersion, APVRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(apvrt!.activeApprovalRequests));
    assert.ok(Array.isArray(apvrt!.pendingApprovals));
    assert.ok(Array.isArray(apvrt!.approvedRequests));
    assert.ok(Array.isArray(apvrt!.rejectedRequests));
    assert.ok(Array.isArray(apvrt!.escalatedRequests));
    assert.ok(Array.isArray(apvrt!.approvalTimelines));
    assert.ok(apvrt!.governanceSummary);
    assert.equal(apvrt!.governanceSummary.neverFabricateApprovalDecisions, true);
    assert.ok(Array.isArray(apvrt!.supportingEvidence));
    assert.ok(apvrt!.auditStatus);
    assert.ok(Array.isArray(apvrt!.outstandingIssues));
    assert.ok(typeof apvrt!.confidenceScore === "number");
    assert.equal(apvrt!.metadataVersion, APVRT_METADATA_VERSION);
    assert.equal(apvrt!.reportVersion, APVRT_REPORT_VERSION);
    assert.equal(apvrt!.consumableByQ1010, true);
    assert.equal(apvrt!.neverImplementQ1010OrLater, true);
    assert.equal(apvrt!.neverFabricateApprovalDecisions, true);
    assert.equal(apvrt!.neverAutoApproveRestrictedActions, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("11 Q1010 contract without implementing Monitoring Runtime", async () => {
    const engine = await build({
      communicationRuntime: {
        getQ1009ConsumableContract: () => ({
          contractId: "comrt-q1009-contract-v1",
          consumerMissionId: "Q10-09",
        }),
      },
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-apvrt-test" }] }),
      },
    });
    engine.produceReport(sampleInput());
    engine.submitReport(sampleInput());
    const contract = engine.getQ1010ConsumableContract();
    assert.equal(contract.producedBy, "approval-runtime");
    assert.equal(contract.missionId, "Q10-09");
    assert.equal(contract.consumerMissionId, "Q10-10");
    assert.equal(contract.neverImplementQ1010OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("activeApprovalRequests"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-09");
    assert.equal(cockpit.neverImplementQ1010OrLater, true);
    assert.equal(cockpit.neverFabricateApprovalDecisions, true);
    assert.ok(cockpit.totalPolicies >= 5);
  });

  test("12 rejects fabricate / auto-approve restricted / Q10-10+ / governance bypass", async () => {
    const engine = await build();
    const fabricate = engine.validate(sampleInput({ fabricateDecision: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const auto = engine.validate(sampleInput({ autoApproveRestricted: true }));
    assert.equal(auto.decision, "fail");
    assert.ok(auto.errors.some((e) => e.toLowerCase().includes("auto-approve")));

    const scope = engine.validate(
      sampleInput({ implementQ1010OrLater: true, targetMissionId: "Q10-10" }),
    );
    assert.equal(scope.decision, "fail");
    assert.ok(
      scope.errors.some((e) => e.includes("Q10-10") || e.includes("Q10-10 or later")),
    );

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const grandKing = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(grandKing.decision, "fail");

    const q1011 = engine.validate(sampleInput({ targetMissionId: "Q10-11" }));
    assert.equal(q1011.decision, "fail");
  });
});
