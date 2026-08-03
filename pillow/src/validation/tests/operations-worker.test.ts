import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STAGES,
  OPSW_CAPABILITIES,
  OPSW_METADATA_VERSION,
  OPERATIONS_REPORT_VERSION,
  buildOperationsWorkerConfiguration,
  createOperationsWorker,
  resetOperationsWorkerForTesting,
  type ApprovedBookingFixture,
  type OpsInput,
} from "../../operations-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function fixtureBooking(overrides: Partial<ApprovedBookingFixture> = {}): ApprovedBookingFixture {
  return {
    bookingId: "bkw-booking-0001",
    businessProjectId: "lbfc-prj-cleaning-01",
    bookingStatus: "confirmed",
    serviceType: "residential_cleaning",
    city: "Singapore",
    area: "Orchard",
    confirmedAt: "2026-08-02T06:00:00.000Z",
    ...overrides,
  };
}

function sampleInput(overrides: Partial<OpsInput> = {}): OpsInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    bookingId: "bkw-booking-0001",
    serviceType: "residential_cleaning",
    city: "Singapore",
    area: "Orchard",
    grandKingInstructions: "Design operational workflows only; never perform customer services or replace Booking/CRM/Lead Generation Workers.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureBooking: fixtureBooking(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createOperationsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOperationsWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-09 Operations Worker", () => {
  beforeEach(resetOperationsWorkerForTesting);

  test("1 locks mandatory operations-worker boundaries", () => {
    const c = buildOperationsWorkerConfiguration(REPO_ROOT, {
      neverFabricateOperationalEvidence: false as never,
      neverPerformCustomerServices: false as never,
      neverReplaceBookingWorker: false as never,
      neverReplaceCrmWorker: false as never,
      neverReplaceLeadGenerationWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ710OrLater: false as never,
    });
    assert.equal(c.neverFabricateOperationalEvidence, true);
    assert.equal(c.neverPerformCustomerServices, true);
    assert.equal(c.neverReplaceBookingWorker, true);
    assert.equal(c.neverReplaceCrmWorker, true);
    assert.equal(c.neverReplaceLeadGenerationWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ710OrLater, true);
    assert.equal(c.preserveCompleteOperationalTraceability, true);
    assert.equal(c.preserveWorkflowAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-OPSW-001 for Q7-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-09");
    assert.equal(state.engineVersion, "PILLOW-OPSW-001");
    assert.equal(state.configuration.workerId, "wkr-operations-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(OPSW_CAPABILITIES.includes("consume_approved_booking"));
    assert.ok(OPSW_CAPABILITIES.includes("generate_service_delivery_workflow"));
    for (const stage of [
      "job_preparation",
      "technician_assignment",
      "dispatch",
      "arrival",
      "service_execution",
      "quality_inspection",
      "customer_sign_off",
      "completion",
      "follow_up",
      "escalation",
      "cancellation",
      "exception",
    ]) {
      assert.ok((OPERATIONAL_STAGES as readonly string[]).includes(stage));
    }
    for (const status of ["draft", "ready_for_q710", "submitted", "unknown"]) {
      assert.ok((AUDIT_STATUSES as readonly string[]).includes(status));
    }
  });

  test("3 consumes approved booking; rejects non-confirmed booking", async () => {
    const engine = await build();
    const consumed = engine.consumeApprovedBooking(sampleInput());
    assert.equal(consumed.action, "consume_approved_booking");
    assert.notEqual(consumed.validation.decision, "fail");
    assert.ok(consumed.latestBookingContext);
    assert.equal(consumed.latestBookingContext!.bookingId, "bkw-booking-0001");
    assert.equal(consumed.latestBookingContext!.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(consumed.latestBookingContext!.bookingStatus, "confirmed");
    assert.equal(consumed.latestBookingContext!.serviceType, "residential_cleaning");
    assert.match(consumed.latestBookingContext!.area, /Orchard/);

    const rejected = engine.consumeApprovedBooking(
      sampleInput({
        fixtureBooking: fixtureBooking({ bookingStatus: "pending_confirmation" }),
      }),
    );
    assert.equal(rejected.action, "consume_approved_booking");
    assert.equal(rejected.validation.decision, "fail");
    assert.equal(rejected.latestBookingContext, null);
    assert.ok(
      rejected.validation.errors.some((e) => e.toLowerCase().includes("confirmed")),
    );
  });

  test("4 generates end-to-end service delivery workflow", async () => {
    const engine = await build();
    engine.consumeApprovedBooking(sampleInput());
    const generated = engine.generateServiceDeliveryWorkflow(sampleInput());
    assert.equal(generated.action, "generate_service_delivery_workflow");
    assert.notEqual(generated.validation.decision, "fail");
    assert.ok(generated.latestWorkflow);
    assert.ok(generated.latestWorkflow!.workflowId.startsWith("opsw-wf-"));
    assert.equal(generated.latestWorkflow!.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(generated.latestWorkflow!.bookingId, "bkw-booking-0001");
    assert.equal(generated.latestWorkflow!.serviceType, "residential_cleaning");
    assert.ok(generated.latestWorkflow!.designOnly);
    assert.ok(generated.latestWorkflow!.stages.length >= 9);
    const stageNames = generated.latestWorkflow!.stages.map((s) => s.stage);
    assert.deepEqual(stageNames, [
      "job_preparation",
      "technician_assignment",
      "dispatch",
      "arrival",
      "service_execution",
      "quality_inspection",
      "customer_sign_off",
      "completion",
      "follow_up",
    ]);
    assert.ok(engine.getWorkflows().length >= 1);

    // Rejects generating a workflow when the resolved booking is not confirmed.
    const engine2 = await build();
    const blocked = engine2.generateServiceDeliveryWorkflow(
      sampleInput({ fixtureBooking: fixtureBooking({ bookingStatus: "cancelled" }) }),
    );
    assert.equal(blocked.validation.decision, "fail");
    assert.equal(blocked.latestWorkflow, null);
  });

  test("5 defines fulfilment checklist and QA checkpoints", async () => {
    const engine = await build();
    const generated = engine.generateServiceDeliveryWorkflow(sampleInput());
    const workflowId = generated.latestWorkflow!.workflowId;

    const checklist = engine.defineFulfilmentChecklist({ workflowId, validated: true });
    assert.equal(checklist.action, "define_fulfilment_checklist");
    assert.notEqual(checklist.validation.decision, "fail");
    assert.ok(checklist.latestChecklist);
    assert.ok(checklist.latestChecklist!.checklistId.startsWith("opsw-checklist-"));
    assert.equal(checklist.latestChecklist!.workflowId, workflowId);
    assert.ok(checklist.latestChecklist!.items.length >= 1);
    assert.ok(checklist.latestChecklist!.designOnly);

    const qa = engine.defineQaCheckpoints({ workflowId, validated: true });
    assert.equal(qa.action, "define_qa_checkpoints");
    assert.notEqual(qa.validation.decision, "fail");
    assert.ok(qa.latestQaCheckpoints);
    assert.ok(qa.latestQaCheckpoints!.qaCheckpointsId.startsWith("opsw-qa-"));
    assert.equal(qa.latestQaCheckpoints!.workflowId, workflowId);
    assert.ok(qa.latestQaCheckpoints!.checkpoints.length >= 1);
    assert.ok(qa.latestQaCheckpoints!.designOnly);
  });

  test("6 defines technician assignment workflow (design only)", async () => {
    const engine = await build();
    const generated = engine.generateServiceDeliveryWorkflow(sampleInput());
    const workflowId = generated.latestWorkflow!.workflowId;
    const assigned = engine.defineTechnicianAssignmentWorkflow({ workflowId, validated: true });
    assert.equal(assigned.action, "define_technician_assignment_workflow");
    assert.notEqual(assigned.validation.decision, "fail");
    assert.ok(assigned.latestAssignmentWorkflow);
    assert.ok(assigned.latestAssignmentWorkflow!.assignmentWorkflowId.startsWith("opsw-assign-"));
    assert.equal(assigned.latestAssignmentWorkflow!.workflowId, workflowId);
    assert.equal(assigned.latestAssignmentWorkflow!.designOnly, true);
    assert.ok(assigned.latestAssignmentWorkflow!.steps.length >= 1);
    assert.ok(assigned.latestAssignmentWorkflow!.fallbackStrategy.length > 0);
  });

  test("7 defines escalation workflow", async () => {
    const engine = await build();
    const generated = engine.generateServiceDeliveryWorkflow(sampleInput());
    const workflowId = generated.latestWorkflow!.workflowId;
    const escalation = engine.defineEscalationWorkflow({ workflowId, validated: true });
    assert.equal(escalation.action, "define_escalation_workflow");
    assert.notEqual(escalation.validation.decision, "fail");
    assert.ok(escalation.latestEscalationWorkflow);
    assert.ok(
      escalation.latestEscalationWorkflow!.escalationWorkflowId.startsWith("opsw-escalation-"),
    );
    assert.equal(escalation.latestEscalationWorkflow!.workflowId, workflowId);
    assert.ok(escalation.latestEscalationWorkflow!.rules.length >= 1);
    assert.equal(escalation.latestEscalationWorkflow!.designOnly, true);
  });

  test("8 defines completion and follow-up workflows", async () => {
    const engine = await build();
    const generated = engine.generateServiceDeliveryWorkflow(sampleInput());
    const workflowId = generated.latestWorkflow!.workflowId;

    const completion = engine.defineCompletionWorkflow({ workflowId, validated: true });
    assert.equal(completion.action, "define_completion_workflow");
    assert.notEqual(completion.validation.decision, "fail");
    assert.ok(completion.latestCompletionWorkflow);
    assert.equal(completion.latestCompletionWorkflow!.signOffRequired, true);
    assert.ok(completion.latestCompletionWorkflow!.steps.length >= 1);

    const followUp = engine.defineFollowUpWorkflow({ workflowId, validated: true });
    assert.equal(followUp.action, "define_follow_up_workflow");
    assert.notEqual(followUp.validation.decision, "fail");
    assert.ok(followUp.latestFollowUpWorkflow);
    assert.ok(followUp.latestFollowUpWorkflow!.steps.length >= 1);
    assert.ok(followUp.latestFollowUpWorkflow!.steps[0]!.timingOffsetDays >= 0);
  });

  test("9 full Operations Report + consumableByQ710", async () => {
    const engine = await build();
    engine.consumeApprovedBooking(sampleInput());
    engine.generateServiceDeliveryWorkflow(sampleInput());
    const report = engine.produceOperationsReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("opsw-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.workflowId.startsWith("opsw-wf-"));
    assert.equal(latest.serviceType, "residential_cleaning");
    assert.ok(latest.operationalStages.length >= 9);
    assert.ok(latest.assignmentWorkflow);
    assert.ok(latest.fulfilmentChecklist);
    assert.ok(latest.qaCheckpoints);
    assert.ok(latest.escalationWorkflow);
    assert.ok(latest.completionWorkflow);
    assert.ok(latest.followUpWorkflow);
    assert.ok(latest.exceptionManagement);
    assert.ok(latest.auditStatus);
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, OPSW_METADATA_VERSION);
    assert.equal(latest.reportVersion, OPERATIONS_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-operations-01");
    assert.equal(latest.sourceBookingId, "bkw-booking-0001");
    assert.equal(latest.consumableByQ710, true);
    assert.equal(latest.neverFabricateOperationalEvidence, true);
    assert.equal(latest.neverPerformCustomerServices, true);
    assert.equal(latest.neverReplaceBookingWorker, true);
    assert.equal(latest.neverReplaceCrmWorker, true);
    assert.equal(latest.neverReplaceLeadGenerationWorker, true);
    assert.equal(latest.neverImplementQ710OrLater, true);
    assert.equal(latest.preserveCompleteOperationalTraceability, true);
    assert.equal(latest.preserveWorkflowAuditHistory, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.ok(
      !JSON.stringify(latest).toLowerCase().includes("job completed successfully"),
      "must never fabricate that a job was performed",
    );
  });

  test("10 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createOperationsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-opsw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceOperationsReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-09"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-opsw-001");
  });

  test("11 rejects Q7-10 / perform customer services / fabricate evidence / replace workers", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-10" },
      { implementQ710OrLater: true },
      { performCustomerServices: true },
      { fabricateOperationalEvidence: true },
      { replaceBookingWorker: true },
      { replaceCrmWorker: true },
      { replaceLeadGenerationWorker: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceOperationsReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("12 Q7-10 consumable contract + cockpit", async () => {
    const engine = await build();
    engine.produceOperationsReport(sampleInput());
    const contract = engine.getQ710ConsumableContract();
    assert.equal(contract.consumableByQ710, true);
    assert.equal(contract.contractVersion, "OPSW-Q710-v1");
    assert.ok(contract.fields.includes("workflowId"));
    assert.ok(contract.fields.includes("operationalStages"));
    assert.ok(contract.fields.includes("fulfilmentChecklist"));
    assert.equal(contract.neverFabricateOperationalEvidence, true);
    assert.equal(contract.neverPerformCustomerServices, true);
    assert.equal(contract.neverReplaceBookingWorker, true);
    assert.equal(contract.neverReplaceCrmWorker, true);
    assert.equal(contract.neverReplaceLeadGenerationWorker, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-09");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ710, true);
    assert.equal(cockpit.neverImplementQ710OrLater, true);
    assert.equal(cockpit.neverPerformCustomerServices, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getWorkflows().length >= 1);
    assert.ok(engine.list().reports.length >= 1);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
