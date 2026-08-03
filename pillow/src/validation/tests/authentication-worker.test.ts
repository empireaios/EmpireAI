import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ATW_INTEGRATION_TARGETS,
  buildAuthenticationWorkerConfiguration,
  createAuthenticationWorker,
  resetAuthenticationWorkerForTesting,
} from "../../authentication-worker/index.js";

const root = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const input = {
  requirementsReportId: "rqw-req-01",
  architectureReportId: "arw-arch-01",
  platformId: "atw-plt-01",
  platformName: "Platform",
  businessId: "atw-biz-01",
  factoryMissionId: "atw-msn-01",
  businessObjective: "Secure platform access",
  validated: true,
};
const requirementsWorker = {
  getRequirementsReports: () => [{ requirementsId: input.requirementsReportId }],
  getLatestRequirementsReportId: () => input.requirementsReportId,
};
const architectureWorker = {
  getArchitectureReports: () => [{ architectureId: input.architectureReportId }],
  getLatestArchitectureReportId: () => input.architectureReportId,
};

async function build(options: {
  configuration?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
} = {}) {
  const bootstrap = await runBootstrap({ repositoryRoot: root, skipHeavyScans: true });
  const engine = createAuthenticationWorker(bootstrap, {
    configuration: options.configuration,
    dependencies: {
      requirementsWorker,
      architectureWorker,
      backendWorker: {},
      databaseWorker: {},
      ...(options.dependencies ?? {}),
    },
  });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q6-07 Authentication Worker", () => {
  beforeEach(resetAuthenticationWorkerForTesting);

  test("1 force locks boundaries", () => {
    const config = buildAuthenticationWorkerConfiguration(root, { neverDefineRoles: false as never });
    assert.equal(config.neverDefineRoles, true);
    assert.equal(config.neverImplementQ608OrLater, true);
    assert.equal(config.neverStorePlaintextPasswords, true);
  });

  test("2 initializes required identity and targets", async () => {
    const engine = await build();
    assert.equal(engine.getState().missionId, "Q6-07");
    assert.equal(engine.getState().engineVersion, "PILLOW-ATW-001");
    for (const target of ATW_INTEGRATION_TARGETS) {
      assert.ok(engine.getState().configuration.integrationTargets.includes(target));
    }
    assert.ok(engine.getState().configuration.integrationTargets.includes("database_worker"));
    assert.ok(engine.getState().configuration.integrationTargets.includes("backend_worker"));
  });

  test("3 receives approved reports", async () => {
    const engine = await build();
    assert.ok(
      engine.receiveApprovedRequirementsReports(input).latestAuthenticationBuildReport!.buildId.startsWith("atw-bld-"),
    );
    assert.equal(
      engine.receiveApprovedArchitectureReports(input).latestAuthenticationBuildReport!.architectureReportId,
      input.architectureReportId,
    );
  });

  test("4 registration never exposes hash", async () => {
    const engine = await build();
    const result = await engine.registerAccount({
      loginIdentifier: "a@example.test",
      password: "correct-horse-1",
    });
    assert.equal("passwordHash" in result.user, false);
    assert.equal(engine.getPublicUser({ userId: result.user.userId })!.loginIdentifier, "a@example.test");
  });

  test("5 login creates valid opaque session", async () => {
    const engine = await build();
    await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const login = await engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" });
    assert.equal(engine.validateSession({ sessionToken: login.sessionToken }).userId, login.user.userId);
  });

  test("6 invalid credentials fail closed and lock", async () => {
    const engine = await build({ configuration: { maxFailedAttempts: 2 } });
    await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    await assert.rejects(engine.login({ loginIdentifier: "a@test", password: "wrong-password" }));
    await assert.rejects(engine.login({ loginIdentifier: "a@test", password: "wrong-password" }));
    await assert.rejects(engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" }));
  });

  test("7 logout revokes session", async () => {
    const engine = await build();
    await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const login = await engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" });
    assert.equal(engine.logout({ sessionToken: login.sessionToken }).revoked, true);
    assert.throws(() => engine.validateSession({ sessionToken: login.sessionToken }));
  });

  test("8 renew rotates session and expired sessions are rejected", async () => {
    const engine = await build({ configuration: { sessionTtlSeconds: 1 } });
    await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const login = await engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const renewal = engine.renewSession({ sessionToken: login.sessionToken });
    assert.notEqual(renewal.sessionToken, login.sessionToken);
    assert.throws(() => engine.validateSession({ sessionToken: login.sessionToken }));
    assert.ok(engine.validateSession({ sessionToken: renewal.sessionToken }));
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.throws(() => engine.validateSession({ sessionToken: renewal.sessionToken }));
  });

  test("9 recovery is generic, single use, revokes sessions", async () => {
    const deliveries: string[] = [];
    const engine = await build({
      dependencies: {
        notificationCapability: {
          notify: (payload: Record<string, unknown>) => {
            if (typeof payload.recoveryToken === "string") deliveries.push(payload.recoveryToken);
          },
        },
      },
    });
    const user = await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const login = await engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const missing = engine.requestPasswordReset({ loginIdentifier: "missing@test" });
    const existing = engine.requestPasswordReset({ loginIdentifier: "a@test" });
    assert.equal(missing.message, existing.message);
    assert.equal("recoveryToken" in missing, false);
    assert.equal("recoveryToken" in existing, false);
    assert.equal(deliveries.length, 1);
    const recoveryToken = deliveries[0]!;
    await engine.resetPassword({ recoveryToken, newPassword: "new-password-123" });
    await assert.rejects(engine.resetPassword({ recoveryToken, newPassword: "new-password-123" }));
    assert.throws(() => engine.validateSession({ sessionToken: login.sessionToken }));
    assert.equal(
      (await engine.login({ loginIdentifier: "a@test", password: "new-password-123" })).user.userId,
      user.user.userId,
    );
  });

  test("10 verification works", async () => {
    const engine = await build();
    const registered = await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    assert.equal(
      (await engine.verifyAccount({
        userId: registered.user.userId,
        verificationToken: registered.verificationToken,
      })).verifiedStatus,
      "verified",
    );
  });

  test("11 report is complete and secret-free", async () => {
    const engine = await build();
    await engine.registerAccount({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const login = await engine.login({ loginIdentifier: "a@test", password: "correct-horse-1" });
    const report = engine.produceAuthenticationBuildReport(input).latestAuthenticationBuildReport!;
    assert.equal(report.buildStatus, "complete");
    assert.equal(report.passwordAlgorithm, "scrypt");
    assert.equal(report.canonicalAuthReference, "backend/src/auth/");
    assert.equal(report.neverDefineRoles, true);
    assert.equal(report.neverDefinePermissions, true);
    const serialized = JSON.stringify(report);
    assert.equal(serialized.includes("correct-horse"), false);
    assert.equal(serialized.includes(login.sessionToken), false);
  });

  test("12 forbids authorization and supports cockpit/audit", async () => {
    const submitted: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: root, skipHeavyScans: true });
    const engine = createAuthenticationWorker(bootstrap, {
      dependencies: {
        requirementsWorker,
        architectureWorker,
        backendWorker: {},
        databaseWorker: {},
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(String(payload.missionId));
            return { records: [{ reportId: "ert-atw-01" }] };
          },
        },
      },
    });
    await engine.initialize();
    assert.equal(engine.produceAuthenticationBuildReport({ ...input, defineRoles: true }).validation.decision, "fail");
    assert.equal(engine.produceAuthenticationBuildReport({ ...input, implementQ608OrLater: true }).validation.decision, "fail");
    const submittedReport = engine.submitReport(input);
    assert.deepEqual(submitted, ["Q6-07"]);
    assert.equal(submittedReport.latestAuthenticationBuildReport!.executiveReportId, "ert-atw-01");
    assert.equal(engine.getCockpitSnapshot().missionId, "Q6-07");
    assert.equal(engine.getAuthAuditEvents().some((event) => /password|token|secret|bearer/i.test(event.details)), false);
  });
});
