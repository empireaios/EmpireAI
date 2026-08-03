import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BOOKING_REPORT_VERSION,
  BOOKING_STATUSES,
  BKW_CAPABILITIES,
  BKW_METADATA_VERSION,
  INTEGRATION_TARGETS,
  buildBookingWorkerConfiguration,
  createBookingWorker,
  resetBookingWorkerForTesting,
  type BookingInput,
  type ServiceOfferFixture,
} from "../../booking-worker/index.js";
import type { ServiceOfferReport } from "../../service-offer-worker/types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixtureServiceOffer(): ServiceOfferFixture {
  return {
    reportId: "sow-rpt-fixture-001",
    businessProjectId: "lbfc-prj-cleaning-01",
    sourceResearchId: "lmrw-res-fixture-001",
    serviceCatalogue: [
      {
        serviceId: "sow-svc-001",
        name: "residential cleaning",
        description: "residential cleaning offer for Orchard",
        category: "cleaning",
        targetSegments: ["busy homeowners", "small offices"],
        geographicCoverage: "Orchard",
      },
      {
        serviceId: "sow-svc-002",
        name: "office cleaning",
        description: "office end-of-day cleaning",
        category: "cleaning",
        targetSegments: ["small offices"],
        geographicCoverage: "Orchard",
      },
    ],
    servicePackages: [
      {
        packageId: "sow-pkg-001",
        name: "residential cleaning — Basic",
        targetCustomer: "busy homeowners",
        pricingModel: "fixed_package",
        estimatedDuration: "2-3 hours",
        durationMinutes: 150,
        geographicCoverage: "Orchard",
        packageType: "basic",
        inclusions: ["core service", "standard consumables"],
        exclusions: ["specialist equipment"],
      },
      {
        packageId: "sow-pkg-002",
        name: "residential cleaning — Premium",
        targetCustomer: "busy homeowners",
        pricingModel: "fixed_package",
        estimatedDuration: "3-4 hours",
        durationMinutes: 210,
        geographicCoverage: "Orchard",
        packageType: "premium",
        inclusions: ["core service", "deep zones", "eco consumables"],
        exclusions: ["renovation cleanup"],
      },
      {
        packageId: "sow-pkg-003",
        name: "office cleaning — Recurring",
        targetCustomer: "small offices",
        pricingModel: "recurring",
        estimatedDuration: "1-2 hours",
        durationMinutes: 90,
        geographicCoverage: "Orchard",
        packageType: "recurring",
        inclusions: ["desk areas", "pantry wipe"],
        exclusions: ["carpet shampoo"],
      },
    ],
    confidenceScore: 0.72,
    executiveSummary: "Approved cleaning offers for Orchard structural booking.",
  };
}

function sampleServiceOfferReport(): ServiceOfferReport {
  const fixture = sampleFixtureServiceOffer();
  return {
    reportId: fixture.reportId!,
    timestamp: "2026-08-02T02:00:00.000Z",
    businessProjectId: fixture.businessProjectId!,
    serviceCatalogue: (fixture.serviceCatalogue ?? []).map((s) => ({
      serviceId: s.serviceId,
      name: s.name,
      description: s.description ?? s.name,
      category: s.category ?? "cleaning",
      targetSegments: [...(s.targetSegments ?? [])],
      geographicCoverage: s.geographicCoverage ?? "Orchard",
      evidenceClass: "estimated",
      sourceResearchRefs: [fixture.sourceResearchId!],
    })),
    servicePackages: (fixture.servicePackages ?? []).map((p) => ({
      packageId: p.packageId,
      name: p.name,
      targetCustomer: p.targetCustomer ?? "busy homeowners",
      pricingModel: p.pricingModel ?? "fixed_package",
      recommendedPrice: {
        value: "SGD 98",
        evidenceClass: "estimated",
        source: "research",
      },
      pricingAssumptions: ["Anchored to Q7-02 pricing findings"],
      estimatedDuration: p.estimatedDuration ?? "2 hours",
      estimatedOperationalCost: {
        value: "SGD 44",
        evidenceClass: "inference",
        source: "assumption",
      },
      estimatedGrossMargin: {
        value: "~35-45%",
        evidenceClass: "inference",
        source: "assumption",
      },
      optionalExtras: [],
      renewalOptions: ["one-off"],
      packageType: (p.packageType as "basic") ?? "basic",
      inclusions: [...(p.inclusions ?? [])],
      exclusions: [...(p.exclusions ?? [])],
      geographicCoverage: p.geographicCoverage ?? "Orchard",
      sourceResearchRefs: [fixture.sourceResearchId!],
    })),
    pricingRecommendations: [],
    packageInclusions: (fixture.servicePackages ?? []).map((p) => ({
      packageId: p.packageId,
      inclusions: [...(p.inclusions ?? [])],
    })),
    packageExclusions: (fixture.servicePackages ?? []).map((p) => ({
      packageId: p.packageId,
      exclusions: [...(p.exclusions ?? [])],
    })),
    guarantees: [],
    fulfilmentRequirements: [],
    operationalAssumptions: ["fixture offer for booking tests"],
    risks: [],
    outstandingQuestions: [],
    confidenceScore: fixture.confidenceScore ?? 0.7,
    executiveSummary: fixture.executiveSummary ?? "fixture",
    metadataVersion: "SOW-001-v1",
    reportVersion: "SOW-RPT-v1",
    workerId: "wkr-service-offer-01",
    sourceResearchId: fixture.sourceResearchId!,
    evidenceAssumptionNotes: ["fixture"],
    consumableByQ704: true,
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: ["q7-03:service_offer:sow-rpt-fixture-001"],
  };
}

function sampleInput(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    customerReference: "cust-orchard-home-01",
    packageId: "sow-pkg-001",
    serviceSelected: "residential cleaning — Basic",
    serviceArea: "Orchard",
    scheduledDateTime: "2026-08-10T10:00:00.000Z",
    durationMinutes: 150,
    assignedWorker: "wkr-tech-clean-01",
    grandKingInstructions: "Book structurally only; no fulfilment or payments.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureServiceOffer: sampleFixtureServiceOffer(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createBookingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBookingWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-04 Booking Worker", () => {
  beforeEach(resetBookingWorkerForTesting);

  test("1 locks mandatory booking-worker boundaries", () => {
    const c = buildBookingWorkerConfiguration(REPO_ROOT, {
      neverPerformTheService: false as never,
      neverProcessPayments: false as never,
      neverReplaceCrm: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateBookingConfirmations: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ705OrLater: false as never,
    });
    assert.equal(c.neverPerformTheService, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverReplaceCrm, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateBookingConfirmations, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ705OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveBookingAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-BKW-001 for Q7-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-04");
    assert.equal(state.engineVersion, "PILLOW-BKW-001");
    assert.equal(state.configuration.workerId, "wkr-booking-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(BKW_CAPABILITIES.includes("consume_service_offer"));
    for (const status of [
      "draft",
      "pending_confirmation",
      "confirmed",
      "modified",
      "rescheduled",
      "cancelled",
      "completed_booking_record",
      "failed",
      "unknown",
    ]) {
      assert.ok((BOOKING_STATUSES as readonly string[]).includes(status));
    }
  });

  test("3 consumes approved service offer from fixture", async () => {
    const engine = await build();
    const fromFixture = engine.consumeServiceOffer(sampleInput());
    assert.equal(fromFixture.action, "consume_service_offer");
    assert.notEqual(fromFixture.validation.decision, "fail");

    const viaId = await build({
      dependencies: {
        serviceOfferWorker: {
          getReports: () => [sampleServiceOfferReport()],
        },
      },
    });
    const consumed = viaId.consumeServiceOffer({
      reportId: "sow-rpt-fixture-001",
      validated: true,
    });
    assert.equal(consumed.validation.decision, "pass");

    const unknown = engine.createBooking({
      ...sampleInput(),
      packageId: "unknown-pkg-999",
      serviceSelected: "nonexistent service",
    });
    assert.equal(unknown.validation.decision, "fail");
  });

  test("4 creates booking with availability validation", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    engine.setAvailability({
      businessProjectId: "lbfc-prj-cleaning-01",
      assignedWorker: "wkr-tech-clean-01",
      startDateTime: "2026-08-10T08:00:00.000Z",
      endDateTime: "2026-08-10T18:00:00.000Z",
      serviceArea: "Orchard",
      validated: true,
    });
    const created = engine.createBooking(sampleInput());
    assert.equal(created.action, "create_booking");
    assert.notEqual(created.validation.decision, "fail");
    assert.ok(created.latestBooking);
    assert.ok(created.latestBooking!.bookingId.startsWith("bkw-bk-"));
    assert.equal(created.latestBooking!.packageId, "sow-pkg-001");
    assert.equal(created.latestBooking!.bookingStatus, "pending_confirmation");
    assert.equal(created.latestBooking!.availabilityValidation.validated, true);
    assert.equal(created.latestBooking!.sourceOfferReportId, "sow-rpt-fixture-001");
  });

  test("5 assigns worker", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput({ assignedWorker: null }));
    const created = engine.createBooking(sampleInput({ assignedWorker: null }));
    const assigned = engine.assignWorker({
      bookingId: created.latestBooking!.bookingId,
      assignedWorker: "wkr-tech-clean-02",
      validated: true,
    });
    assert.equal(assigned.action, "assign_worker");
    assert.equal(assigned.validation.decision, "pass");
    assert.equal(assigned.latestBooking!.assignedWorker, "wkr-tech-clean-02");
  });

  test("6 prevents scheduling conflicts (double-book fails)", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    const first = engine.createBooking(sampleInput());
    assert.notEqual(first.validation.decision, "fail");
    const conflict = engine.createBooking(
      sampleInput({
        customerReference: "cust-other-02",
        scheduledDateTime: "2026-08-10T11:00:00.000Z",
        assignedWorker: "wkr-tech-clean-01",
      }),
    );
    assert.equal(conflict.validation.decision, "fail");
    assert.ok(
      conflict.validation.errors.some((e) => e.toLowerCase().includes("double-book")),
    );
    assert.equal(conflict.latestBooking, null);
  });

  test("7 modify booking", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    const created = engine.createBooking(sampleInput());
    const modified = engine.modifyBooking({
      bookingId: created.latestBooking!.bookingId,
      scheduledDateTime: "2026-08-11T14:00:00.000Z",
      validated: true,
    });
    assert.equal(modified.action, "modify_booking");
    assert.equal(modified.validation.decision, "pass");
    assert.equal(modified.latestBooking!.bookingStatus, "modified");
    assert.equal(modified.latestBooking!.scheduledDateTime, "2026-08-11T14:00:00.000Z");
  });

  test("8 cancel booking", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    const created = engine.createBooking(sampleInput());
    const cancelled = engine.cancelBooking({
      bookingId: created.latestBooking!.bookingId,
      validated: true,
    });
    assert.equal(cancelled.action, "cancel_booking");
    assert.equal(cancelled.validation.decision, "pass");
    assert.equal(cancelled.latestBooking!.bookingStatus, "cancelled");

    // Cancelling frees the slot — same worker can book again
    const again = engine.createBooking(
      sampleInput({
        customerReference: "cust-after-cancel",
        scheduledDateTime: "2026-08-10T10:00:00.000Z",
        assignedWorker: "wkr-tech-clean-01",
      }),
    );
    assert.notEqual(again.validation.decision, "fail");
  });

  test("9 generate confirmation (never fabricate without valid booking)", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    const fabricated = engine.generateConfirmation({
      bookingId: "bkw-bk-does-not-exist",
      validated: true,
    });
    assert.equal(fabricated.validation.decision, "fail");
    assert.equal(fabricated.latestConfirmation, null);

    const created = engine.createBooking(sampleInput());
    const confirmed = engine.generateConfirmation({
      bookingId: created.latestBooking!.bookingId,
      validated: true,
    });
    assert.equal(confirmed.action, "generate_confirmation");
    assert.equal(confirmed.validation.decision, "pass");
    assert.ok(confirmed.latestConfirmation);
    assert.ok(confirmed.latestConfirmation!.confirmationId.startsWith("bkw-cfm-"));
    assert.equal(confirmed.latestConfirmation!.fabricated, false);
    assert.equal(confirmed.latestBooking!.bookingStatus, "confirmed");
  });

  test("10 full Booking Report required fields + consumableByQ705", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    engine.createBooking(sampleInput());
    const report = engine.produceBookingReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("bkw-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.bookingId.startsWith("bkw-bk-"));
    assert.ok(latest.customerReference);
    assert.ok(latest.serviceSelected);
    assert.ok(latest.scheduledDateTime);
    assert.ok(latest.assignedWorker);
    assert.ok(latest.bookingStatus);
    assert.ok(latest.availabilityValidation);
    assert.ok(latest.auditStatus);
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, BKW_METADATA_VERSION);
    assert.equal(latest.reportVersion, BOOKING_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-booking-01");
    assert.equal(latest.sourceOfferReportId, "sow-rpt-fixture-001");
    assert.equal(latest.packageId, "sow-pkg-001");
    assert.ok(latest.serviceArea);
    assert.ok(latest.durationMinutes > 0);
    assert.equal(typeof latest.reminderScheduled, "boolean");
    assert.equal(latest.recurringSeriesId, null);
    assert.equal(typeof latest.conflictCheckPassed, "boolean");
    assert.equal(latest.consumableByQ705, true);
    assert.equal(latest.neverPerformTheService, true);
    assert.equal(latest.neverProcessPayments, true);
    assert.equal(latest.neverReplaceCrm, true);
    assert.equal(latest.neverFabricateBookingConfirmations, true);
    assert.equal(latest.neverImplementQ705OrLater, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.submittedToExecutiveReporting, false);
  });

  test("11 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createBookingWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-bkw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.consumeServiceOffer(sampleInput());
    const produced = engine.produceBookingReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-04"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-bkw-001");
  });

  test("12 rejects Q7-05 / fabricate confirmation / process payment / perform service + Q705 contract + cockpit", async () => {
    const engine = await build();
    engine.consumeServiceOffer(sampleInput());
    for (const forbidden of [
      { missionId: "Q7-05" },
      { implementQ705OrLater: true },
      { fabricateBookingConfirmations: true },
      { processPayments: true },
      { performTheService: true },
      { replaceCrm: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceBookingReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }

    engine.createBooking(sampleInput());
    engine.produceBookingReport(sampleInput());
    const contract = engine.getQ705ConsumableContract();
    assert.equal(contract.consumableByQ705, true);
    assert.equal(contract.contractVersion, "BKW-Q705-v1");
    assert.ok(contract.fields.includes("bookingId"));
    assert.ok(contract.fields.includes("scheduledDateTime"));
    assert.equal(contract.neverPerformTheService, true);
    assert.equal(contract.neverFabricateBookingConfirmations, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-04");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ705, true);
    assert.equal(cockpit.neverImplementQ705OrLater, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getBookingHistory().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.list().reports.length >= 1);
    assert.ok(engine.getBookings().length >= 1);
  });
});
