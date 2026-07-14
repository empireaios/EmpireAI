import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../app.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import { env } from "../../config/env.js";
import { configureValidationEnvironment } from "../harness.js";

describe("G4-05B — Authentication verification", () => {
  before(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
  });

  after(() => {
    resetDatabaseInstance();
  });

  it("rejects invalid login credentials", async () => {
    const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
    try {
      const response = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "wrong@test.com", password: "wrong" },
      });
      assert.equal(response.statusCode, 401);
      const body = response.json() as { error: string };
      assert.match(body.error, /invalid/i);
    } finally {
      await empire.shutdown();
    }
  });

  it("creates session cookie and returns Grand King platformIdentity", async () => {
    const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD },
      });
      assert.equal(login.statusCode, 200);
      const cookie = login.headers["set-cookie"];
      assert.ok(cookie);
      assert.match(String(cookie), /empireai_session=/);
      assert.match(String(cookie), /HttpOnly/i);

      const body = login.json() as {
        user: { email: string; platformIdentity: string; role: string };
      };
      assert.equal(body.user.email, env.FOUNDER_EMAIL);
      assert.equal(body.user.platformIdentity, "grand-king");
      assert.equal(body.user.role, "founder");
    } finally {
      await empire.shutdown();
    }
  });

  it("validates session on /auth/me and allows Executive Home dispatch", async () => {
    const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD },
      });
      const cookie = String(login.headers["set-cookie"]);

      const me = await empire.app.inject({
        method: "GET",
        url: "/auth/me",
        headers: { cookie },
      });
      assert.equal(me.statusCode, 200);
      const meBody = me.json() as { user: { platformIdentity: string } };
      assert.equal(meBody.user.platformIdentity, "grand-king");

      const dispatch = await empire.app.inject({
        method: "POST",
        url: "/brain/dispatch",
        headers: { cookie },
        payload: { module: "executive-home", action: "load" },
      });
      assert.equal(dispatch.statusCode, 200);
      const dispatchBody = dispatch.json() as { status: string; result?: unknown };
      assert.equal(dispatchBody.status, "completed");
      assert.ok(dispatchBody.result);
    } finally {
      await empire.shutdown();
    }
  });

  it("destroys session on logout and rejects subsequent /auth/me", async () => {
    const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD },
      });
      const cookie = String(login.headers["set-cookie"]);

      const logout = await empire.app.inject({
        method: "POST",
        url: "/auth/logout",
        headers: { cookie },
      });
      assert.equal(logout.statusCode, 200);

      const me = await empire.app.inject({
        method: "GET",
        url: "/auth/me",
        headers: { cookie },
      });
      assert.equal(me.statusCode, 401);
    } finally {
      await empire.shutdown();
    }
  });
});
