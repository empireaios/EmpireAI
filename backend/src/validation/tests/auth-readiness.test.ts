import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { resetDatabaseInstance } from "../../brain/database.js";
import { configureValidationEnvironment } from "../harness.js";
import { seedDefaultUsers } from "../../auth/seed-users.js";
import { assessAuthReadiness } from "../../auth/auth-readiness.js";

describe("Grand King auth readiness", () => {
  before(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
  });

  after(() => {
    resetDatabaseInstance();
  });

  it("reports not ready when founder identity is missing", () => {
    const report = assessAuthReadiness();
    assert.equal(report.ready, false);
    assert.equal(report.grandKingAccess, "blocked");
    assert.ok(
      report.blockers.some((b) => /founder account missing/i.test(b)),
      `expected missing founder blocker, got: ${report.blockers.join("; ")}`,
    );
  });

  it("reports ready after idempotent founder seed", async () => {
    await seedDefaultUsers();
    await seedDefaultUsers();
    const report = assessAuthReadiness();
    assert.equal(report.ready, true);
    assert.equal(report.grandKingAccess, "ready");
    assert.equal(report.platformIdentity, "grand-king");
    assert.ok(report.founderIdentityId);
    assert.equal(report.founderEmailPresent, true);
  });
});
