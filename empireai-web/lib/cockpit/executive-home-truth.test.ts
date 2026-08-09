import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveKpiDisplayValue } from "@/lib/cockpit/kpis/resolve-kpi-values";
import { COCKPIT_UX_NAVIGATION } from "@/lib/cockpit-ux/navigation";
import { PILLOW_WORKSPACE_LAYOUT } from "@/lib/cockpit/executive/pillow-workspace-layout";

const PROHIBITED =
  /Awaiting implementation|coming soon|TBD|lorem ipsum|dummy data|mock LIVE|fixture/i;

const root = join(process.cwd());

describe("executive home truth + nav reality", () => {
  it("LIVE KPIs never surface placeholder demo values", () => {
    const result = resolveKpiDisplayValue(
      {
        id: "K-E-001",
        label: "GMV",
        dataMode: "live",
        placeholderValue: "$1.63M",
        placeholderTrend: "▲",
      } as never,
      [],
    );
    assert.notEqual(result.value, "$1.63M");
    assert.match(result.value, /Not yet measured|—|0/i);
  });

  it("active navigation has no prohibited placeholder labels", () => {
    for (const item of COCKPIT_UX_NAVIGATION) {
      assert.ok(!PROHIBITED.test(item.label), item.label);
      assert.ok(!PROHIBITED.test(item.description), item.description);
      assert.ok(item.href.startsWith("/cockpit"), item.href);
    }
    assert.equal(COCKPIT_UX_NAVIGATION.length, 14);
  });

  it("department IA centres are not in active Grand King nav", () => {
    const ids = new Set(COCKPIT_UX_NAVIGATION.map((n) => n.id));
    for (const removed of [
      "command_centre",
      "intelligence",
      "finance",
      "ai_workforce",
      "infrastructure",
      "relationship_graph",
    ]) {
      assert.equal(ids.has(removed as never), false, removed);
    }
  });

  it("Pillow workspace layout targets are genuinely large", () => {
    assert.ok(PILLOW_WORKSPACE_LAYOUT.workspaceMinVh >= 75);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.messageHistoryMinVh >= 50);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.composerMinPx >= 160);
    assert.equal(PILLOW_WORKSPACE_LAYOUT.pillowBesideCentres, false);
  });

  it("Executive Home places Pillow above secondary centres (not beside)", () => {
    const page = readFileSync(
      join(root, "components/cockpit/pages/ExecutiveHomePage.tsx"),
      "utf8",
    );
    assert.match(page, /executive-pillow-anchor/);
    assert.match(page, /Secondary centre summaries/);
    assert.ok(!/lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,2fr\)\]/.test(page));
    const pillowIdx = page.indexOf('id="executive-pillow-anchor"');
    const centresIdx = page.indexOf("Secondary centre summaries");
    assert.ok(pillowIdx > 0 && centresIdx > pillowIdx);
  });

  it("Pillow composer and history use large sizing classes", () => {
    const chat = readFileSync(
      join(root, "components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx"),
      "utf8",
    );
    assert.match(chat, /min-h-\[180px\]/);
    assert.match(chat, /min-h-\[50vh\]/);
    assert.match(chat, /min-h-\[75vh\]/);
    assert.match(chat, /empireai:focus-pillow|PILLOW_WORKSPACE_LAYOUT\.focusEventName/);
  });

  it("Commerce decision workspace is a large surface not a tiny accordion-only path", () => {
    const decision = readFileSync(
      join(root, "components/cockpit/executive/CommerceDecisionWorkspace.tsx"),
      "utf8",
    );
    assert.match(decision, /commerce-decision-workspace/);
    assert.match(decision, /Ask Pillow about this/);
    assert.match(decision, /min-h-\[75vh\]/);
    assert.ok(!/<details/.test(decision));
  });
});
