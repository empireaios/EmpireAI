import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveKpiDisplayValue } from "@/lib/cockpit/kpis/resolve-kpi-values";
import { COCKPIT_UX_NAVIGATION } from "@/lib/cockpit-ux/navigation";
import { PILLOW_WORKSPACE_LAYOUT } from "@/lib/cockpit/executive/pillow-workspace-layout";
import { toExecutiveCommerceLanguage } from "@/lib/cockpit/executive/executive-language";

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

  it("Pillow workspace layout targets are genuinely large and page-scroll friendly", () => {
    assert.ok(PILLOW_WORKSPACE_LAYOUT.workspaceMinVh >= 70);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.messageHistoryMinVh >= 45);
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

  it("Pillow composer and history use large sizing without scroll prison", () => {
    const chat = readFileSync(
      join(root, "components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx"),
      "utf8",
    );
    assert.match(chat, /min-h-\[180px\]/);
    assert.match(chat, /min-h-\[48vh\]|min-h-\[50vh\]/);
    assert.match(chat, /min-h-\[70vh\]|min-h-\[75vh\]/);
    assert.match(chat, /page-primary|overscroll-y-auto/);
    assert.match(chat, /empireai:focus-pillow|PILLOW_WORKSPACE_LAYOUT\.focusEventName/);
    assert.ok(!/h-\[min\(88vh/.test(chat), "fixed 88vh scroll prison removed");
  });

  it("Commerce decision workspace is natural-language first with technical disclosure", () => {
    const decision = readFileSync(
      join(root, "components/cockpit/executive/CommerceDecisionWorkspace.tsx"),
      "utf8",
    );
    assert.match(decision, /commerce-decision-workspace/);
    assert.match(decision, /Ask Pillow about this/);
    assert.match(decision, /Technical details/);
    assert.match(decision, /toExecutiveCommerceLanguage/);
  });

  it("executive language hides raw CJ/SKU from default headline", () => {
    const card = toExecutiveCommerceLanguage({
      productName: "Portable Mini Fan",
      asin: "B0FKFNCT52",
      cjPid: "2608080908321600000",
      amazonSellerSku: "EMP-FD-MSL1SDPF",
      offerPrice: "$24.25",
      expectedProfitUsd: "$8.10",
      approvalStatus: "PENDING_APPROVAL",
      disposition: "APPROVE",
      competingOffers: "$9.99",
    });
    assert.equal(card.headline, "Portable Mini Fan");
    assert.match(card.economicsLine, /\$24\.25/);
    assert.ok(!card.headline.includes("EMP-FD"));
    assert.ok(card.technicalDetails.some((d) => d.value === "B0FKFNCT52"));
  });

  it("background context refresh must not share chat loading (Send must stay usable)", () => {
    const provider = readFileSync(
      join(root, "lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx"),
      "utf8",
    );
    const refreshStart = provider.indexOf("const refreshContext = useCallback");
    const refreshEnd = provider.indexOf(
      "}, [pathname, state.pageOverride, syncExecutiveAwareness]);",
    );
    assert.ok(refreshStart > 0 && refreshEnd > refreshStart);
    const refreshBody = provider.slice(refreshStart, refreshEnd);
    assert.ok(
      !/loading:\s*true/.test(refreshBody),
      "refreshContext must not set loading:true — that blocks Send / shows fake Preparing",
    );
    assert.match(
      provider,
      /Never share chat `loading` with background context refresh/,
    );
  });

  it("sidebar stays sticky so nav remains clickable after scroll", () => {
    const sidebar = readFileSync(
      join(root, "components/cockpit/shell/CockpitSidebar.tsx"),
      "utf8",
    );
    assert.match(sidebar, /sticky/);
    assert.match(sidebar, /h-dvh|h-screen/);
    assert.match(sidebar, /z-50/);
  });

  it("secondary polls use fetch budget and do not stack", () => {
    const founder = readFileSync(
      join(root, "lib/founder-shell/FounderShellProvider.tsx"),
      "utf8",
    );
    const commerce = readFileSync(
      join(root, "lib/commerce-operating-model/useCommerceOperatingModel.ts"),
      "utf8",
    );
    assert.match(founder, /fetchWithBudget/);
    assert.match(founder, /inFlight/);
    assert.match(commerce, /fetchWithBudget/);
    assert.match(commerce, /enabled/);
  });
});
