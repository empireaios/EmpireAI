import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  EXECUTIVE_NOT_READY_REPLY,
  EXECUTIVE_PIPELINE_SOFT_REPLY,
  EXECUTIVE_RECOVERING_LABEL,
  EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
  hasForbiddenLifecycleResidue,
  isTerminalInfrastructureSurface,
  leaksInternalArchitecture,
  toExecutiveChatMessage,
  toExecutiveSurfaceMessage,
} from "./executive-surface.js";
import {
  gradeVisibleExecutiveResponse,
  NEGATIVE_CONTROL_FIXTURES,
  toVisibleGrandKingText,
} from "./visible-response-oracle.js";

describe("executive surface language", () => {
  test("detects infrastructure leaks", () => {
    assert.equal(
      leaksInternalArchitecture(
        "Constitutional gate: Pillow executive pipeline unavailable. Brain assistant fallback is disabled.",
      ),
      true,
    );
    assert.equal(leaksInternalArchitecture("Sustainable profit remains the supreme directive."), false);
  });

  test("rewrites leaks to executive recovering language", () => {
    const out = toExecutiveSurfaceMessage(
      "Restore the Pillow host session and retry. Digital Soul unavailable.",
    );
    assert.equal(out, EXECUTIVE_RECOVERING_LABEL);
    assert.equal(leaksInternalArchitecture(out), false);
  });

  test("chat sanitizer maps architecture leaks to terminal — never soft success", () => {
    const out = toExecutiveChatMessage(
      "Constitutional gate: No constitutionally gated LLM provider is available.",
    );
    assert.equal(out, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY);
    assert.equal(isTerminalInfrastructureSurface(out), true);
    assert.equal(hasForbiddenLifecycleResidue(out), false);
  });

  test("legacy soft reply symbol is terminal infrastructure, not success boilerplate", () => {
    assert.equal(EXECUTIVE_PIPELINE_SOFT_REPLY, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY);
    assert.equal(EXECUTIVE_NOT_READY_REPLY, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY);
    assert.doesNotMatch(EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY, /catching up|verified operating state/i);
    assert.equal(hasForbiddenLifecycleResidue(EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY), false);
  });

  test("ask-again / resubmit bodies become terminal, not soft success", () => {
    const out = toExecutiveChatMessage(
      "I accepted your request, but the deep reasoning path could not finish. Please send the same ask once more in a moment.",
    );
    assert.equal(out, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY);
  });

  test("substantial answers keep content when only a leak sentence is present", () => {
    const body = [
      "### Forecast",
      "$4200 is an estimate, not realised revenue.",
      "Constitutional gate: temporary note.",
      "### Identity",
      "Co-occurrence does not prove the same entity.",
    ].join("\n");
    const out = toExecutiveChatMessage(body);
    assert.match(out, /estimate/i);
    assert.match(out, /co-occurrence/i);
    assert.doesNotMatch(out, /constitutional gate/i);
  });

  test("detects forbidden lifecycle residue", () => {
    assert.equal(
      hasForbiddenLifecycleResidue(
        "Full deliberation may still be catching up; I will not ask you to resubmit.",
      ),
      true,
    );
  });
});

describe("visible response oracle — certification integrity", () => {
  test("every negative control fails", () => {
    for (const fix of NEGATIVE_CONTROL_FIXTURES) {
      const g = gradeVisibleExecutiveResponse(fix.input);
      assert.equal(g.ok, false, `${fix.id} must FAIL but passed: ${JSON.stringify(g)}`);
    }
  });

  test("HTTP 200 useless prose fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: "Noted.",
      alreadyVisible: true,
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("USEFUL_SEMANTIC_ANSWER"));
  });

  test("second turn cannot rescue first turn", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: "### Forecast\n$100 is an estimate only.\n### Identity\nunproven\n### Supersession\nlater ledger",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
      firstTurnVisible: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
    });
    assert.equal(g.ok, false);
    assert.ok(g.reasons.includes("second_turn_cannot_rescue_first_turn"));
  });

  test("good visible answer passes", () => {
    const api = [
      "### Forecast",
      "$4200 is an estimate, not realised.",
      "### Identity",
      "Co-occurrence of ZX-Alpha and QR-91 does not prove identity.",
      "### Supersession",
      "Later ledger supersedes the realised line only.",
      "### Synthesis",
      "Keep claims bounded to supplied evidence.",
    ].join("\n");
    const visible = toVisibleGrandKingText(api);
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: visible,
      alreadyVisible: true,
      require: [/forecast|estimate/i, /identity|co-occurr/i, /supersed/i],
      minSections: 4,
    });
    assert.equal(g.ok, true, JSON.stringify(g));
  });

  test("API degraded ask-again sanitizes to terminal and fails semantic cert", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage:
        "I accepted your request, but the deep reasoning path could not finish after bounded recovery. Please send the same ask once more in a moment.",
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(isTerminalInfrastructureSurface(g.visible));
  });
});
