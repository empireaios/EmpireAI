import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import { canvaConnectTools } from "../../execution/canva-connect-connector/tools/canva-connect-tools.js";
import { visualGenerationTools } from "../../orchestration/visual-generation-layer/tools/visual-generation-tools.js";
import {
  assertCanvaEnvConfigured,
  CANVA_PRODUCTION_CALLBACK_URL,
  exchangeCanvaOAuthCode,
  generateCodeChallenge,
  generateCodeVerifier,
  getCanvaOAuthUrl,
  resetCanvaRepository,
  resetCanvaConnectApiClient,
  CanvaOAuthError,
  parseOAuthState,
} from "../../execution/canva-connect-connector/index.js";
import {
  createVisualAsset,
  generateCommerceCreative,
  getVisualGenerationHealth,
  DEFAULT_VISUAL_PROVIDER,
} from "../../orchestration/visual-generation-layer/index.js";
import { resetCredentialVaultRepository } from "../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import { resetConnectorRuntimeStates } from "../../orchestration/reality-integration/services/connector-runtime.js";
import type { ToolContext } from "../../brain/types.js";
import { buildApp } from "../../app.js";

const WORKSPACE_ID = "ws-canva-test";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "canva-visual-test",
    correlationId: "corr-canva",
  };
}

async function invokeCanvaTool(name: string, args: Record<string, unknown> = {}) {
  const tool = canvaConnectTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

async function invokeVisualTool(name: string, args: Record<string, unknown> = {}) {
  const tool = visualGenerationTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

async function connectCanvaMock() {
  const { url, state } = getCanvaOAuthUrl({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
  });
  await exchangeCanvaOAuthCode({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    code: "mock-auth-code",
    state,
  });
  return { url, state };
}

beforeEach(() => {
  configureValidationEnvironment();
  process.env.CANVA_MOCK = "true";
  delete process.env.CANVA_CLIENT_ID;
  delete process.env.CANVA_CLIENT_SECRET;
  resetCanvaRepository();
  resetCanvaConnectApiClient();
  resetCredentialVaultRepository();
  resetConnectorRuntimeStates();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Canva Connect + Visual Generation Layer", () => {
  it("registers Canva OAuth and Visual Generation Brain tools", () => {
    assert.equal(canvaConnectTools.length, 5);
    assert.ok(canvaConnectTools.some((tool) => tool.name === "canva.get_oauth_url"));
    assert.equal(visualGenerationTools.length, 11);
    assert.ok(visualGenerationTools.some((tool) => tool.name === "visual_generation.create_visual_asset"));
  });

  it("PKCE generates valid code challenge", () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    assert.ok(verifier.length >= 43);
    assert.ok(challenge.length >= 43);
    assert.notEqual(verifier, challenge);
  });

  it("builds Canva OAuth authorization URL with state", () => {
    const result = getCanvaOAuthUrl({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });
    assert.match(result.url, /canva\.com\/api\/oauth\/authorize/);
    assert.match(result.url, /code_challenge=/);
    assert.match(result.url, /code_challenge_method=s256/i);
    assert.match(result.state, new RegExp(`${WORKSPACE_ID}:${COMPANY_ID}`));
    assert.match(result.url, /redirect_uri=/);
  });

  it("uses the canonical production callback URL constant", () => {
    assert.equal(
      CANVA_PRODUCTION_CALLBACK_URL,
      "https://empire-ai.co/api/integrations/canva/callback",
    );
  });

  it("parses OAuth state for callback workspace routing", () => {
    const { state } = getCanvaOAuthUrl({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });
    const parsed = parseOAuthState(state);
    assert.deepEqual(parsed, {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });
  });

  it("GET /canva/oauth/callback exchanges code using state only", async () => {
    const empire = await buildApp({
      startWorkers: false,
      startScheduler: false,
      pillowEnabled: false,
    });

    try {
      const { state } = getCanvaOAuthUrl({
        workspaceId: WORKSPACE_ID,
        companyId: COMPANY_ID,
      });

      const callbackRes = await empire.app.inject({
        method: "GET",
        url: `/canva/oauth/callback?code=mock-auth-code&state=${encodeURIComponent(state)}`,
      });

      assert.equal(callbackRes.statusCode, 200, callbackRes.body);
      const body = callbackRes.json() as { connected: boolean; mock: boolean };
      assert.equal(body.connected, true);
      assert.equal(body.mock, true);
    } finally {
      await empire.shutdown();
    }
  });

  it("exchanges OAuth code with PKCE in mock mode", async () => {
    const { state } = await connectCanvaMock();
    const status = (await invokeCanvaTool("canva.get_oauth_status")) as {
      connected: boolean;
      mock: boolean;
    };
    assert.equal(status.connected, true);
    assert.equal(status.mock, true);
    assert.ok(state);
  });

  it("rejects invalid OAuth state", async () => {
    getCanvaOAuthUrl({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    await assert.rejects(
      () =>
        exchangeCanvaOAuthCode({
          workspaceId: WORKSPACE_ID,
          companyId: COMPANY_ID,
          code: "bad-code",
          state: "invalid-state",
        }),
      CanvaOAuthError,
    );
  });

  it("requires environment variables when mock is disabled", () => {
    process.env.CANVA_MOCK = "false";
    delete process.env.CANVA_CLIENT_ID;
    delete process.env.CANVA_CLIENT_SECRET;
    assert.throws(() => assertCanvaEnvConfigured(), CanvaOAuthError);
  });

  it("routes visual production through Visual Generation Layer (commerce)", async () => {
    await connectCanvaMock();
    const result = await generateCommerceCreative({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      title: "Grand King Product Hero",
      prompt: "Premium product listing image",
    });
    assert.equal(result.provider, "canva");
    assert.equal(result.useCase, "commerce");
    assert.equal(result.status, "success");
    assert.ok(result.designId);
    assert.ok(result.exportLocation);
  });

  it("routes media creatives through Visual Generation Layer", async () => {
    await connectCanvaMock();
    const result = (await invokeVisualTool("visual_generation.create_visual_asset", {
      useCase: "media",
      title: "Media Business Social Graphic",
    })) as { provider: string; status: string; designId: string | null };
    assert.equal(result.provider, "canva");
    assert.equal(result.status, "success");
    assert.ok(result.designId);
  });

  it("exports design via Visual Generation Layer", async () => {
    await connectCanvaMock();
    const created = await createVisualAsset({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      useCase: "marketing",
      title: "Export Test",
    });
    const exported = (await invokeVisualTool("visual_generation.export", {
      designId: created.designId,
      format: "png",
    })) as { exportFormat: string | null; exportLocation: string | null };
    assert.equal(exported.exportFormat, "png");
    assert.ok(exported.exportLocation);
  });

  it("defaults to Canva as visual provider", () => {
    assert.equal(DEFAULT_VISUAL_PROVIDER, "canva");
  });

  it("reports Visual Generation Layer health", async () => {
    await connectCanvaMock();
    const health = await getVisualGenerationHealth(WORKSPACE_ID, COMPANY_ID);
    assert.equal(health.layerId, "visual-generation-layer");
    assert.equal(health.defaultProvider, "canva");
    assert.equal(health.providers[0]?.providerId, "canva");
    assert.equal(health.providers[0]?.connected, true);
  });

  it("business engines use visual_generation tools not canva design tools directly", () => {
    const canvaDesignTools = canvaConnectTools.filter((tool) =>
      tool.name.includes("create_design") || tool.name.includes("export"),
    );
    assert.equal(canvaDesignTools.length, 0);
    assert.ok(visualGenerationTools.some((tool) => tool.module === "visual-generation-layer"));
  });
});
