import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createConnectorRegistryModule } from "../../eye/connector-registry/index.js";
import { createInMemoryConnectorRegistry } from "../../eye/connector-registry/index.js";
import {
  calculateNextRunAt,
  createConnectorPollingSchedulerModule,
  createInMemoryPollingSchedulerRepository,
} from "../../eye/connector-polling-scheduler/index.js";
import {
  createConnectorSignalIngestionModule,
  createInMemoryConnectorSignalIngestionRepository,
} from "../../eye/connector-signal-ingestion/index.js";
import { createGlobalProductSignalModule } from "../../eye/global-product-signals/index.js";
import { createInMemoryProductSignalRegistry } from "../../eye/global-product-signals/index.js";

const WORKSPACE_ID = "ws-m037";

function createTestSchedulerStack(pollHandler?: Parameters<typeof createConnectorPollingSchedulerModule>[3]) {
  const connectorRegistry = createInMemoryConnectorRegistry();
  const productSignalRegistry = createInMemoryProductSignalRegistry();
  const ingestionRepository = createInMemoryConnectorSignalIngestionRepository();
  const pollingRepository = createInMemoryPollingSchedulerRepository();

  const connectorModule = createConnectorRegistryModule(connectorRegistry);
  const productSignalModule = createGlobalProductSignalModule(productSignalRegistry);
  const ingestionModule = createConnectorSignalIngestionModule(
    ingestionRepository,
    connectorModule,
    productSignalModule,
  );
  const schedulerModule = createConnectorPollingSchedulerModule(
    pollingRepository,
    connectorModule,
    ingestionModule,
    pollHandler,
  );

  return {
    connectorModule,
    ingestionModule,
    productSignalModule,
    schedulerModule,
    pollingRepository,
  };
}

async function seedActiveHealthyConnector(
  connectorModule: ReturnType<typeof createConnectorRegistryModule>,
  connectorId: string,
) {
  await connectorModule.registerKnownConnector(WORKSPACE_ID, connectorId);
  await connectorModule.updateConnectorStatus(WORKSPACE_ID, connectorId, "ACTIVE");
  await connectorModule.updateConnectorHealth(WORKSPACE_ID, connectorId, {
    healthState: "HEALTHY",
    message: "Connector operating normally",
    consecutiveFailures: 0,
    lastSuccessAt: new Date().toISOString(),
  });
}

describe("Mission 037 Eye Connector Polling Scheduler", () => {
  it("creates polling jobs and schedules for active connectors", async () => {
    const { connectorModule, schedulerModule } = createTestSchedulerStack();
    await seedActiveHealthyConnector(connectorModule, "amazon");
    await connectorModule.registerKnownConnector(WORKSPACE_ID, "reddit");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "reddit", "ACTIVE");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "reddit", "PAUSED");

    const plan = await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID, {
      defaultIntervalSec: 900,
      defaultProductId: "prod-m037",
    });

    assert.equal(plan.jobsCreated, 1);
    assert.equal(plan.schedulesCreated, 1);
    assert.deepEqual(plan.skippedConnectorIds, ["reddit"]);

    const schedules = await schedulerModule.listSchedules(WORKSPACE_ID);
    assert.equal(schedules.length, 1);
    assert.equal(schedules[0]!.connectorId, "amazon");
    assert.equal(schedules[0]!.intervalSec, 900);
    assert.equal(schedules[0]!.enabled, true);
  });

  it("polls active connectors when schedules are due", async () => {
    const { connectorModule, schedulerModule } = createTestSchedulerStack();
    await seedActiveHealthyConnector(connectorModule, "google-trends");

    await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID, {
      defaultIntervalSec: 600,
      productIdByConnector: { "google-trends": "prod-m037-trend" },
    });

    const dueAt = new Date().toISOString();
    const results = await schedulerModule.runDuePolls(WORKSPACE_ID, dueAt);

    assert.equal(results.length, 1);
    assert.equal(results[0]!.status, "SUCCESS");
    assert.equal(results[0]!.connectorId, "google-trends");
  });

  it("skips disabled or paused connectors during planning and execution", async () => {
    const { connectorModule, schedulerModule, pollingRepository } = createTestSchedulerStack();
    await connectorModule.registerKnownConnector(WORKSPACE_ID, "shopify");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "shopify", "DISABLED");

    const plan = await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID);
    assert.equal(plan.jobsCreated, 0);
    assert.deepEqual(plan.skippedConnectorIds, ["shopify"]);

    const job = await schedulerModule.createPollingJob(WORKSPACE_ID, {
      connectorId: "shopify",
      productId: "prod-m037-shopify",
    });
    const schedule = await schedulerModule.createPollingSchedule(WORKSPACE_ID, {
      jobId: job.jobId,
      connectorId: "shopify",
      intervalSec: 300,
      nextRunAt: new Date().toISOString(),
    });

    const jobRecord = await pollingRepository.getJobById(WORKSPACE_ID, job.jobId);
    assert.ok(jobRecord);
    const result = await schedulerModule.runDuePolls(WORKSPACE_ID, new Date().toISOString());
    assert.equal(result.length, 1);
    assert.equal(result[0]!.status, "SKIPPED");
    assert.match(result[0]!.reason, /DISABLED/);

    const scheduleAfter = await pollingRepository.getScheduleById(WORKSPACE_ID, schedule.scheduleId);
    assert.ok(scheduleAfter?.nextRunAt);
  });

  it("ingests successful polling observations into the global product signal registry", async () => {
    const { connectorModule, schedulerModule, productSignalModule } = createTestSchedulerStack();
    await seedActiveHealthyConnector(connectorModule, "amazon");

    await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID, {
      productIdByConnector: { amazon: "prod-m037-amazon" },
    });

    const results = await schedulerModule.runDuePolls(WORKSPACE_ID, new Date().toISOString());
    assert.equal(results[0]!.status, "SUCCESS");
    assert.ok(results[0]!.signalId);

    const signal = await productSignalModule.getSignal(WORKSPACE_ID, results[0]!.signalId!);
    assert.ok(signal);
    assert.equal(signal!.productId, "prod-m037-amazon");
    assert.equal(signal!.source, "AMAZON");
  });

  it("captures failed polling results when observation handling fails", async () => {
    const { connectorModule, schedulerModule } = createTestSchedulerStack(async () => {
      throw new Error("Simulated connector poll failure");
    });
    await seedActiveHealthyConnector(connectorModule, "tiktok");

    await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID, {
      productIdByConnector: { tiktok: "prod-m037-tiktok" },
    });

    const results = await schedulerModule.runDuePolls(WORKSPACE_ID, new Date().toISOString());
    assert.equal(results.length, 1);
    assert.equal(results[0]!.status, "FAILED");
    assert.match(results[0]!.reason, /Simulated connector poll failure/);

    const stored = await schedulerModule.listPollingResults(WORKSPACE_ID, { status: "FAILED" });
    assert.equal(stored.length, 1);
  });

  it("calculates nextRunAt from the last poll timestamp and interval", async () => {
    const { schedulerModule } = createTestSchedulerStack();
    const runAt = "2026-06-21T12:00:00.000Z";
    const nextRunAt = schedulerModule.calculateNextRunAt(runAt, 1800);

    assert.equal(nextRunAt, calculateNextRunAt(runAt, 1800));
    assert.equal(nextRunAt, "2026-06-21T12:30:00.000Z");
  });

  it("supports manual poll triggers outside the due schedule window", async () => {
    const { connectorModule, schedulerModule, pollingRepository } = createTestSchedulerStack();
    await seedActiveHealthyConnector(connectorModule, "pinterest");

    const plan = await schedulerModule.planActiveConnectorJobs(WORKSPACE_ID, {
      defaultIntervalSec: 7200,
      productIdByConnector: { pinterest: "prod-m037-pin" },
    });
    assert.equal(plan.jobsCreated, 1);

    const schedules = await schedulerModule.listSchedules(WORKSPACE_ID);
    const schedule = schedules[0]!;
    const futureRunAt = new Date(Date.now() + 86_400_000).toISOString();
    await pollingRepository.updateSchedule(WORKSPACE_ID, schedule.scheduleId, {
      nextRunAt: futureRunAt,
    });

    const dueResults = await schedulerModule.runDuePolls(
      WORKSPACE_ID,
      new Date().toISOString(),
    );
    assert.equal(dueResults.length, 0);

    const job = await pollingRepository.getJobByConnector(WORKSPACE_ID, "pinterest");
    assert.ok(job);
    const manualResult = await schedulerModule.triggerManualPoll(WORKSPACE_ID, job.jobId);
    assert.equal(manualResult.status, "SUCCESS");
    assert.ok(manualResult.signalId);

    const updatedSchedule = await pollingRepository.getScheduleById(
      WORKSPACE_ID,
      schedule.scheduleId,
    );
    assert.ok(updatedSchedule?.lastRunAt);
    assert.ok(updatedSchedule.nextRunAt);
    assert.ok(updatedSchedule.nextRunAt! < futureRunAt);
  });
});
