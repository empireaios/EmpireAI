import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { CANONICAL_ENTITY_IDS } from "../../foundation/identity-registry/index.js";
import {
  CANONICAL_PROMISE_IDS,
  addPromiseDependency,
  fulfillPromise,
  getPromise,
  getPromiseDependencyGraph,
  initializePromiseRegister,
  listPromiseLifecycle,
  listPromises,
  markPromiseObsolete,
  promiseRegisterTools,
  registerPromise,
  resetPromiseRepository,
  supersedePromise,
  updatePromiseProgress,
} from "../../foundation/promise-register/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s007";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "promise-register",
    correlationId: "corr-s007",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = promiseRegisterTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetPromiseRepository();
});

afterEach(() => {
  resetPromiseRepository();
  resetDatabaseInstance();
});

describe("S007 Promise Register", () => {
  it("registers thirteen promise register Brain tools", () => {
    assert.equal(promiseRegisterTools.length, 13);
    assert.ok(promiseRegisterTools.some((tool) => tool.name === "promise_register.fulfill"));
    assert.ok(promiseRegisterTools.some((tool) => tool.name === "promise_register.dependency_graph"));
  });

  it("seeds default promises made to Grand King", () => {
    const promises = initializePromiseRegister(WORKSPACE_ID);

    assert.equal(promises.length, 3);
    assert.ok(promises.every((p) => p.madeToKingId === CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT));
    assert.ok(promises.some((p) => p.promiseId === CANONICAL_PROMISE_IDS.EMPIRE_PROTECTION));
    assert.ok(promises.some((p) => p.status === "FULFILLED"));
    assert.ok(promises.some((p) => p.status === "IN_PROGRESS"));
  });

  it("registers new promises with PENDING status and zero progress", () => {
    initializePromiseRegister(WORKSPACE_ID);

    const promise = registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:custom-test",
      title: "Custom Promise to King",
      statement: "Deliver first live revenue to Grand King",
      actor: "founder@test.com",
    });

    assert.equal(promise.status, "PENDING");
    assert.equal(promise.progressPercent, 0);
    assert.equal(promise.madeToKingId, CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT);

    const lifecycle = listPromiseLifecycle(promise.promiseId);
    assert.ok(lifecycle.some((entry) => entry.event === "REGISTERED"));
  });

  it("tracks progress updates and status transitions", () => {
    initializePromiseRegister(WORKSPACE_ID);

    const updated = updatePromiseProgress({
      promiseId: CANONICAL_PROMISE_IDS.REVENUE_TRUTH,
      progressPercent: 65,
      progressNotes: "Ledger integration progressing",
      actor: "founder@test.com",
    });

    assert.equal(updated.progressPercent, 65);
    assert.equal(updated.status, "IN_PROGRESS");

    const lifecycle = listPromiseLifecycle(CANONICAL_PROMISE_IDS.REVENUE_TRUTH);
    assert.ok(lifecycle.some((entry) => entry.event === "PROGRESS_UPDATED"));
  });

  it("tracks dependencies between promises", () => {
    initializePromiseRegister(WORKSPACE_ID);

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:dependent-test",
      title: "Dependent Promise",
      statement: "Depends on empire protection",
      actor: "founder@test.com",
    });

    const withDep = addPromiseDependency(
      "promise:dependent-test",
      CANONICAL_PROMISE_IDS.EMPIRE_PROTECTION,
      "founder@test.com",
    );
    assert.ok(withDep.dependencies.includes(CANONICAL_PROMISE_IDS.EMPIRE_PROTECTION));

    const lifecycle = listPromiseLifecycle("promise:dependent-test");
    assert.ok(lifecycle.some((entry) => entry.event === "DEPENDENCY_ADDED"));

    const graph = getPromiseDependencyGraph(WORKSPACE_ID);
    assert.ok(graph.edges.some((edge) => edge.from === "promise:dependent-test"));
  });

  it("fulfills promises when dependencies are met", () => {
    initializePromiseRegister(WORKSPACE_ID);

    const fulfilled = fulfillPromise(
      CANONICAL_PROMISE_IDS.REVENUE_TRUTH,
      "founder@test.com",
      "Revenue truth validated via ledger",
    );

    assert.equal(fulfilled.status, "FULFILLED");
    assert.equal(fulfilled.progressPercent, 100);
    assert.ok(fulfilled.fulfilledAt);

    const lifecycle = listPromiseLifecycle(CANONICAL_PROMISE_IDS.REVENUE_TRUTH);
    assert.ok(lifecycle.some((entry) => entry.event === "FULFILLED"));
  });

  it("blocks fulfillment when dependencies are unresolved", () => {
    initializePromiseRegister(WORKSPACE_ID);

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:blocked-fulfill",
      title: "Blocked Promise",
      statement: "Cannot fulfill until dependency met",
      dependencies: [CANONICAL_PROMISE_IDS.LIVING_SOUL],
      actor: "founder@test.com",
    });

    assert.throws(
      () => fulfillPromise("promise:blocked-fulfill", "founder@test.com"),
      (error: Error) => error.name === "PromiseConflictError",
    );
  });

  it("marks promises obsolete without removing them from register", () => {
    initializePromiseRegister(WORKSPACE_ID);

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:to-obsolete",
      title: "Obsolete Promise",
      statement: "Will become obsolete",
      actor: "founder@test.com",
    });

    const obsolete = markPromiseObsolete("promise:to-obsolete", "founder@test.com", "No longer relevant");
    assert.equal(obsolete.status, "OBSOLETE");

    const stillExists = getPromise("promise:to-obsolete");
    assert.ok(stillExists);
    assert.equal(stillExists?.status, "OBSOLETE");

    const allPromises = listPromises(WORKSPACE_ID);
    assert.ok(allPromises.some((p) => p.promiseId === "promise:to-obsolete"));

    const lifecycle = listPromiseLifecycle("promise:to-obsolete");
    assert.ok(lifecycle.some((entry) => entry.event === "OBSOLETED"));
  });

  it("supersedes promises while preserving history", () => {
    initializePromiseRegister(WORKSPACE_ID);

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:old-version",
      title: "Old Promise",
      statement: "Superseded version",
      actor: "founder@test.com",
    });

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:new-version",
      title: "New Promise",
      statement: "Replacement promise",
      actor: "founder@test.com",
    });

    const superseded = supersedePromise(
      "promise:old-version",
      "promise:new-version",
      "founder@test.com",
    );

    assert.equal(superseded.status, "SUPERSEDED");
    assert.equal(superseded.supersededBy, "promise:new-version");
    assert.ok(getPromise("promise:old-version"));

    const lifecycle = listPromiseLifecycle("promise:old-version");
    assert.ok(lifecycle.some((entry) => entry.event === "SUPERSEDED"));
  });

  it("no promise shall disappear — all statuses remain listable", () => {
    initializePromiseRegister(WORKSPACE_ID);

    registerPromise({
      workspaceId: WORKSPACE_ID,
      promiseId: "promise:lifecycle-test",
      title: "Lifecycle Test",
      statement: "Tests immutability",
      actor: "founder@test.com",
    });

    fulfillPromise(CANONICAL_PROMISE_IDS.LIVING_SOUL, "founder@test.com");
    markPromiseObsolete("promise:lifecycle-test", "founder@test.com");

    const all = listPromises(WORKSPACE_ID);
    assert.ok(all.some((p) => p.status === "FULFILLED"));
    assert.ok(all.some((p) => p.status === "OBSOLETE"));
    assert.ok(all.some((p) => p.status === "IN_PROGRESS"));
    assert.equal(all.length, 4);
  });

  it("exposes promise operations via Brain tools", async () => {
    const listed = (await invokeTool("promise_register.list")) as { promises: unknown[] };
    assert.ok(Array.isArray(listed.promises));
    assert.ok((listed.promises as unknown[]).length >= 3);

    const graph = (await invokeTool("promise_register.dependency_graph")) as {
      promises: unknown[];
      edges: unknown[];
    };
    assert.ok(Array.isArray(graph.promises));
    assert.ok(Array.isArray(graph.edges));
  });
});
