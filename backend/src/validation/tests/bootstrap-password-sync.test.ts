import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import bcrypt from "bcryptjs";
import { resetDatabaseInstance, getDatabase } from "../../brain/database.js";
import { env } from "../../config/env.js";
import { configureValidationEnvironment } from "../harness.js";
import { seedDefaultUsers, verifyPassword } from "../../auth/seed-users.js";
import { UserStore } from "../../auth/session-store.js";

describe("Bootstrap account password sync", () => {
  before(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
  });

  after(() => {
    resetDatabaseInstance();
  });

  it("re-hashes founder password when env password no longer matches stored hash", async () => {
    const db = getDatabase();
    const users = new UserStore(db);

    const staleHash = await bcrypt.hash("StalePassword-NotEnv!", 12);
    users.create({
      email: env.FOUNDER_EMAIL,
      name: "Empire Founder",
      role: "founder",
      workspaceId: "ws_empire_1",
      passwordHash: staleHash,
    });

    assert.equal(await verifyPassword(env.FOUNDER_PASSWORD, staleHash), false);

    await seedDefaultUsers();

    const synced = users.findByEmail(env.FOUNDER_EMAIL);
    assert.ok(synced);
    assert.equal(await verifyPassword(env.FOUNDER_PASSWORD, synced!.passwordHash), true);
  });
});
