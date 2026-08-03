import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CONVERSION_STAGES,
  INTEGRATION_TARGETS,
  LEAD_SOURCES,
  LGW_CAPABILITIES,
  LGW_METADATA_VERSION,
  LEAD_GENERATION_REPORT_VERSION,
  QUALIFICATION_STATUSES,
  buildLeadGenerationWorkerConfiguration,
  createLeadGenerationWorker,
  resetLeadGenerationWorkerForTesting,
  type LeadGenInput,
  type LocalSeoFixture,
} from "../../lead-generation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function fixtureLocalSeo(): LocalSeoFixture {
  return {
    reportId: "lseo-rpt-fixture-001",
    businessProjectId: "lbfc-prj-cleaning-01",
    businessName: "Orchard Sparkle Clean",
    serviceCategory: "cleaning",
    targetLocation: "Orchard, Singapore",
    landingPagesGenerated: [
      {
        pageId: "lseo-page-001",
        pageType: "landing",
        title: "Orchard Sparkle Clean — cleaning in Orchard",
        urlRecommendation: "/singapore/orchard/cleaning",
        serviceName: "cleaning",
        locationLabel: "Orchard, Singapore",
      },
    ],
    localKeywords: [
      { phrase: "cleaning near me" },
      { phrase: "orchard cleaning" },
    ],
    confidenceScore: 0.72,
  };
}

function sampleFormSubmission(overrides: Record<string, string> = {}) {
  return {
    contactName: "Alex Orchard",
    contactPhone: "+65-6000-1111",
    contactEmail: "alex@example.local",
    interest: "residential cleaning",
    message: "Need a deep clean next week",
    ...overrides,
  };
}

function sampleInput(overrides: Partial<LeadGenInput> = {}): LeadGenInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    businessName: "Orchard Sparkle Clean",
    serviceCategory: "cleaning",
    targetLocation: "Orchard, Singapore",
    leadSource: "landing_page",
    grandKingInstructions: "Capture leads only; never execute ads or replace CRM/booking.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureLocalSeo: fixtureLocalSeo(),
    formSubmission: sampleFormSubmission(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createLeadGenerationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLeadGenerationWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-08 Lead Generation Worker", () => {
  beforeEach(resetLeadGenerationWorkerForTesting);

  test("1 locks mandatory lead-generation-worker boundaries", () => {
    const c = buildLeadGenerationWorkerConfiguration(REPO_ROOT, {
      neverExecuteAdvertisingCampaigns: false as never,
      neverReplaceCrm: false as never,
      neverReplaceBookingWorker: false as never,
      neverDeliverCustomerJobs: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateLeadOrConversionResults: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ709OrLater: false as never,
    });
    assert.equal(c.neverExecuteAdvertisingCampaigns, true);
    assert.equal(c.neverReplaceCrm, true);
    assert.equal(c.neverReplaceBookingWorker, true);
    assert.equal(c.neverDeliverCustomerJobs, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateLeadOrConversionResults, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ709OrLater, true);
    assert.equal(c.preserveCompleteLeadTraceability, true);
    assert.equal(c.preserveFunnelAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeProhibitedPersonalData, true);
  });

  test("2 initializes PILLOW-LGW-001 for Q7-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-08");
    assert.equal(state.engineVersion, "PILLOW-LGW-001");
    assert.equal(state.configuration.workerId, "wkr-lead-generation-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(LGW_CAPABILITIES.includes("create_lead_funnel"));
    assert.ok(LGW_CAPABILITIES.includes("capture_lead"));
    for (const source of ["website_form", "landing_page", "whatsapp", "unknown"]) {
      assert.ok((LEAD_SOURCES as readonly string[]).includes(source));
    }
    for (const q of ["new", "qualified", "routed_to_crm", "unknown"]) {
      assert.ok((QUALIFICATION_STATUSES as readonly string[]).includes(q));
    }
    for (const stage of ["visitor", "enquiry", "converted", "unknown"]) {
      assert.ok((CONVERSION_STAGES as readonly string[]).includes(stage));
    }
  });

  test("3 creates lead funnel", async () => {
    const engine = await build();
    const created = engine.createLeadFunnel(sampleInput());
    assert.equal(created.action, "create_lead_funnel");
    assert.notEqual(created.validation.decision, "fail");
    assert.ok(created.latestFunnel);
    assert.ok(created.latestFunnel!.funnelId.startsWith("lgw-funnel-"));
    assert.equal(created.latestFunnel!.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(created.latestFunnel!.serviceCategory, "cleaning");
    assert.match(created.latestFunnel!.targetLocation, /Orchard/);
    assert.equal(created.latestFunnel!.sourceSeoReportId, "lseo-rpt-fixture-001");
    assert.ok(created.latestFunnel!.landingPageRefs.includes("/singapore/orchard/cleaning"));
    assert.ok(engine.getFunnels().length >= 1);
  });

  test("4 captures lead successfully", async () => {
    const engine = await build();
    engine.createLeadFunnel(sampleInput());
    engine.generateEnquiryForm(sampleInput());
    const captured = engine.captureLead(
      sampleInput({
        contactName: "Alex Orchard",
        contactPhone: "+65-6000-1111",
        interest: "residential cleaning",
        formSubmission: sampleFormSubmission(),
      }),
    );
    assert.equal(captured.action, "capture_lead");
    assert.notEqual(captured.validation.decision, "fail");
    assert.ok(captured.latestLead);
    assert.ok(captured.latestLead!.leadId.startsWith("lgw-lead-"));
    assert.equal(captured.latestLead!.contactName, "Alex Orchard");
    assert.equal(captured.latestLead!.interest, "residential cleaning");
    assert.equal(captured.latestLead!.fabricated, false);
    assert.equal(captured.latestLead!.conversionStage, "enquiry");
    assert.ok(engine.getLeads().length >= 1);
  });

  test("5 lead qualification functioning", async () => {
    const engine = await build();
    engine.captureLead(sampleInput());
    const qualified = engine.qualifyLead(sampleInput());
    assert.equal(qualified.action, "qualify_lead");
    assert.equal(qualified.validation.decision, "pass");
    assert.ok(qualified.latestLead);
    assert.equal(qualified.latestLead!.qualificationStatus, "qualified");
    assert.equal(qualified.latestLead!.conversionStage, "qualified_lead");

    const scored = engine.scoreLead({
      leadId: qualified.latestLead!.leadId,
      validated: true,
    });
    assert.equal(scored.action, "score_lead");
    assert.ok(scored.latestLead!.score);
    assert.equal(scored.latestLead!.score!.fabricated, false);
    assert.ok(scored.latestLead!.score!.value > 0);
    assert.ok(["low", "medium", "high"].includes(scored.latestLead!.score!.band));
  });

  test("6 CRM integration routing (injected mock)", async () => {
    const crmCalls: string[] = [];
    const engine = await build({
      dependencies: {
        crmWorker: {
          captureLead: (input) => {
            crmCalls.push(`captureLead:${String(input.contactName)}`);
            return { latestLead: { leadId: "crmw-lead-mock-001" } };
          },
          updateLeadStatus: (input) => {
            crmCalls.push(`updateLeadStatus:${String(input.leadStatus)}`);
            return {};
          },
          recordContact: (input) => {
            crmCalls.push(`recordContact:${String(input.contactName)}`);
            return {};
          },
          getLatestLeadId: () => "crmw-lead-mock-001",
        },
      },
    });
    engine.captureLead(sampleInput());
    engine.qualifyLead(sampleInput());
    const routed = engine.routeLeadToCrm(sampleInput());
    assert.equal(routed.action, "route_lead_to_crm");
    assert.equal(routed.validation.decision, "pass");
    assert.equal(routed.latestLead!.crmIntegrationStatus, "routed");
    assert.equal(routed.latestLead!.crmLeadRef, "crmw-lead-mock-001");
    assert.equal(routed.latestLead!.qualificationStatus, "routed_to_crm");
    assert.ok(crmCalls.some((c) => c.startsWith("captureLead:")));
  });

  test("7 Booking routing for qualified leads (injected mock)", async () => {
    const bookingCalls: string[] = [];
    const engine = await build({
      dependencies: {
        bookingWorker: {
          createBooking: (input) => {
            bookingCalls.push(`createBooking:${String(input.customerReference)}`);
            return { latestBooking: { bookingId: "bkw-bk-mock-001" } };
          },
          getLatestBookingId: () => "bkw-bk-mock-001",
        },
      },
    });
    engine.captureLead(sampleInput());
    engine.qualifyLead(sampleInput());
    const routed = engine.routeLeadToBooking(sampleInput());
    assert.equal(routed.action, "route_lead_to_booking");
    assert.equal(routed.validation.decision, "pass");
    assert.equal(routed.latestLead!.bookingIntegrationStatus, "routed");
    assert.equal(routed.latestLead!.bookingRef, "bkw-bk-mock-001");
    assert.equal(routed.latestLead!.conversionStage, "booking_requested");
    assert.ok(bookingCalls.some((c) => c.startsWith("createBooking:")));
  });

  test("8 funnel metrics generated from observed captures only", async () => {
    const engine = await build();
    const funnel = engine.createLeadFunnel(sampleInput());
    const empty = engine.measureFunnelPerformance({
      funnelId: funnel.latestFunnel!.funnelId,
      validated: true,
    });
    assert.equal(empty.action, "measure_funnel_performance");
    assert.ok(empty.latestMetrics);
    assert.equal(empty.latestMetrics!.totalCapturedLeads, 0);
    assert.equal(empty.latestMetrics!.averageScore, null);
    assert.equal(empty.latestMetrics!.derivedFromObservedCapturesOnly, true);
    assert.equal(empty.latestMetrics!.neverFabricated, true);
    assert.ok(
      empty.latestMetrics!.notes.some((n) => n.toLowerCase().includes("never fabricated")),
    );

    engine.captureLead(
      sampleInput({
        funnelId: funnel.latestFunnel!.funnelId,
        formSubmission: sampleFormSubmission(),
      }),
    );
    engine.captureLead(
      sampleInput({
        funnelId: funnel.latestFunnel!.funnelId,
        contactName: "Blair Orchard",
        formSubmission: sampleFormSubmission({ contactName: "Blair Orchard" }),
      }),
    );
    const measured = engine.measureFunnelPerformance({
      funnelId: funnel.latestFunnel!.funnelId,
      validated: true,
    });
    assert.equal(measured.latestMetrics!.totalCapturedLeads, 2);
    assert.equal(measured.latestMetrics!.leadsBySource.landing_page, 2);
    assert.ok(measured.latestMetrics!.confidenceScore > 0);
    assert.ok(
      !JSON.stringify(measured.latestMetrics).toLowerCase().includes("ad spend"),
      "must never fabricate advertising performance",
    );
  });

  test("9 full Lead Generation Report + consumableByQ709", async () => {
    const engine = await build();
    engine.createLeadFunnel(sampleInput());
    engine.generateEnquiryForm(sampleInput());
    engine.captureLead(sampleInput());
    engine.qualifyLead(sampleInput());
    engine.scoreLead(sampleInput());
    const report = engine.produceLeadGenerationReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("lgw-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.funnelId.startsWith("lgw-funnel-"));
    assert.ok(latest.leadSource);
    assert.ok(latest.leadQualificationStatus);
    assert.ok(latest.leadScore);
    assert.ok(latest.crmIntegrationStatus);
    assert.ok(latest.bookingIntegrationStatus);
    assert.ok(latest.conversionStage);
    assert.ok(latest.funnelPerformanceSummary);
    assert.equal(latest.funnelPerformanceSummary.derivedFromObservedCapturesOnly, true);
    assert.ok(latest.auditStatus);
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, LGW_METADATA_VERSION);
    assert.equal(latest.reportVersion, LEAD_GENERATION_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-lead-generation-01");
    assert.ok(latest.forms.length >= 1);
    assert.ok(latest.forms[0]!.formId.startsWith("lgw-form-"));
    assert.ok(latest.capturedLeads.length >= 1);
    assert.ok(latest.sourceAttribution);
    assert.equal(latest.sourceSeoReportId, "lseo-rpt-fixture-001");
    assert.equal(latest.consumableByQ709, true);
    assert.equal(latest.neverExecuteAdvertisingCampaigns, true);
    assert.equal(latest.neverReplaceCrm, true);
    assert.equal(latest.neverReplaceBookingWorker, true);
    assert.equal(latest.neverFabricateLeadOrConversionResults, true);
    assert.equal(latest.neverImplementQ709OrLater, true);
    assert.equal(latest.preserveCompleteLeadTraceability, true);
    assert.equal(latest.preserveFunnelAuditHistory, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("10 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createLeadGenerationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-lgw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceLeadGenerationReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-08"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-lgw-001");
  });

  test("11 rejects Q7-09 / fabricate conversions / execute ads / replace CRM / replace booking", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-09" },
      { implementQ709OrLater: true },
      { fabricateLeadOrConversionResults: true },
      { executeAdvertisingCampaigns: true },
      { replaceCrm: true },
      { replaceBookingWorker: true },
      { deliverCustomerJobs: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceLeadGenerationReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("12 Q7-09 consumable contract + cockpit", async () => {
    const engine = await build();
    engine.produceLeadGenerationReport(sampleInput());
    const contract = engine.getQ709ConsumableContract();
    assert.equal(contract.consumableByQ709, true);
    assert.equal(contract.contractVersion, "LGW-Q709-v1");
    assert.ok(contract.fields.includes("funnelId"));
    assert.ok(contract.fields.includes("capturedLeads"));
    assert.ok(contract.fields.includes("funnelPerformanceSummary"));
    assert.equal(contract.neverExecuteAdvertisingCampaigns, true);
    assert.equal(contract.neverFabricateLeadOrConversionResults, true);
    assert.equal(contract.neverReplaceCrm, true);
    assert.equal(contract.neverReplaceBookingWorker, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-08");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ709, true);
    assert.equal(cockpit.neverImplementQ709OrLater, true);
    assert.equal(cockpit.neverExecuteAdvertisingCampaigns, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getFunnels().length >= 1);
    assert.ok(engine.list().reports.length >= 1);
  });
});
