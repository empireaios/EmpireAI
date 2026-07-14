import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildExecutiveContextSnapshot,
  buildPillowActionPrompt,
  buildPillowWorkspaceContext,
  buildProactiveGuidance,
  resolveCockpitScreenContext,
} from "./index.js";

describe("P7-03 Pillow UX", () => {
  test("resolves cockpit screen context for executive home", () => {
    const meta = resolveCockpitScreenContext("/cockpit");
    assert.equal(meta.screenId, "SCR-001");
    assert.match(meta.screenTitle, /Executive Home/i);
  });

  test("builds workspace context with constitutional executive fields", () => {
    const ctx = buildPillowWorkspaceContext({
      screenPath: "/cockpit/founder/builder",
      navigationHistory: ["/cockpit", "/cockpit/founder/builder"],
      executive: {
        currentMission: "P7-03",
        currentJourney: "P7 Experience",
        builderStatus: "active",
        recommendations: ["Review Builder ETA"],
        risks: ["Recovery pending"],
      },
    });
    assert.equal(ctx.currentMission, "P7-03");
    assert.equal(ctx.builderStatus, "active");
    assert.ok(ctx.recommendations?.includes("Review Builder ETA"));
  });

  test("builds executive snapshot from founder shell payload", () => {
    const snapshot = buildExecutiveContextSnapshot({
      founderShell: {
        founderShellEngine: {
          cockpit: {
            shellHealth: "healthy",
            context: {
              currentBusiness: "EmpireAI",
              currentMission: "P7-03",
              currentJourney: "P7 Experience",
            },
            executiveHome: {
              builderStatus: "ready",
              supervisorStatus: "monitoring",
              alerts: ["⚠ Test alert"],
              recommendations: ["Ship Pillow UX"],
            },
            grandKingSummary: "Empire operating normally",
          },
        },
      },
      pendingApprovals: 2,
      nextExecutiveAction: "Review Pillow UX mission",
    });
    assert.equal(snapshot.currentMission, "P7-03");
    assert.equal(snapshot.pendingApprovals, 2);
    assert.ok(snapshot.recommendations.includes("Ship Pillow UX"));
    assert.ok(snapshot.risks.length >= 1);
  });

  test("proactive guidance includes explainability fields", () => {
    const guidance = buildProactiveGuidance({
      currentBusiness: null,
      currentMission: "P7-03",
      currentJourney: null,
      currentRoadmapItem: null,
      builderStatus: null,
      supervisorStatus: null,
      productionStatus: null,
      guardianStatus: null,
      pendingApprovals: 1,
      alertCount: 0,
      recommendations: [],
      risks: [],
      nextExecutiveAction: "Approve mission",
      grandKingSummary: null,
    });
    assert.ok(guidance.length >= 2);
    const next = guidance.find((g) => g.id === "next-action");
    assert.ok(next?.why && next.what && next.how);
  });

  test("executive action prompts require explainability structure", () => {
    const prompt = buildPillowActionPrompt("recommend", {
      screenTitle: "Executive Home",
      screenPath: "/cockpit",
    });
    assert.match(prompt, /WHY/i);
    assert.match(prompt, /WHAT/i);
    assert.match(prompt, /HOW/i);
    assert.match(prompt, /PROOF/i);
  });
});
