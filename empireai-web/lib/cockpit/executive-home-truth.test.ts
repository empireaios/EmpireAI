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

  it("Pillow workspace layout uses bounded chat shell (Mission 007)", () => {
    assert.equal(PILLOW_WORKSPACE_LAYOUT.messageHistoryInternalScroll, true);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.visibleMessageWindow >= 20);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.chatShellMaxVh <= 80);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.composerMinPx >= 80);
    assert.ok(PILLOW_WORKSPACE_LAYOUT.composerMaxPx <= 360);
    assert.equal(PILLOW_WORKSPACE_LAYOUT.pillowBesideCentres, false);
    assert.equal(PILLOW_WORKSPACE_LAYOUT.historyOverscrollBehavior, "auto");
  });

  it("Executive Home places owner hierarchy before secondary centres", () => {
    const page = readFileSync(
      join(root, "components/cockpit/pages/ExecutiveHomePage.tsx"),
      "utf8",
    );
    assert.match(page, /EmpireStatusBand/);
    assert.match(page, /PillowCompactPresence/);
    assert.match(page, /GrandKingAttentionPanel/);
    assert.match(page, /CanonicalTruthStrip/);
    assert.match(page, /SinceLastVisitStrip/);
    assert.match(page, /Secondary centre summaries/);
    assert.ok(!/ExecutiveHomeChatWorkspace/.test(page), "full chat must not live on EH");
    assert.ok(!/lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,2fr\)\]/.test(page));
    const statusIdx = page.indexOf("EmpireStatusBand");
    const centresIdx = page.indexOf("Secondary centre summaries");
    assert.ok(statusIdx > 0 && centresIdx > statusIdx);
  });

  it("Pillow conversation workspace is a full chat surface (not tiny history strip)", () => {
    const chat = readFileSync(
      join(root, "components/cockpit/executive/PillowConversationWorkspace.tsx"),
      "utf8",
    );
    assert.match(chat, /pillow-conversation-workspace/);
    assert.match(chat, /data-testid="pillow-message-history"/);
    assert.match(chat, /data-testid="pillow-composer"/);
    assert.match(chat, /Context ▸|Context/);
    assert.match(chat, /Show earlier messages|windowSize/i);
    assert.ok(/min-h-\[560px\]|h-\[min\(85vh/.test(chat), "conversation uses majority height");
    assert.ok(!/max-h-\[62vh\]/.test(chat), "62vh history prison removed");
    assert.ok(!/Load earlier messages \(\d+ hidden\)/.test(chat));
  });

  it("navigation marks unavailable centres honestly (Mission 007)", () => {
    const settings = COCKPIT_UX_NAVIGATION.find((n) => n.id === "settings");
    assert.ok(settings);
    assert.equal(settings?.availability, "unavailable");
    assert.ok(settings?.unavailableReason);
    const commerce = COCKPIT_UX_NAVIGATION.find((n) => n.id === "commerce");
    assert.equal(commerce?.href, "/cockpit/commerce/operating");
  });

  it("Commerce decision workspace is natural-language first with technical disclosure", () => {
    const decision = readFileSync(
      join(root, "components/cockpit/executive/CommerceDecisionWorkspace.tsx"),
      "utf8",
    );
    assert.match(decision, /commerce-decision-workspace/);
    assert.match(decision, /Ask Pillow/);
    assert.match(decision, /Challenge Pillow/);
    assert.match(decision, /Technical details|full evidence/i);
    assert.match(decision, /Lowest competitor|lowestCompetitorPriceUsd/);
    assert.match(decision, /toExecutiveCommerceLanguage|explainListingRoute/);
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

  it("expand() must not auto-focus Pillow (mount expand must not trap page scroll)", () => {
    const provider = readFileSync(
      join(root, "lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx"),
      "utf8",
    );
    const expandStart = provider.indexOf("Mark panel expanded only");
    assert.ok(expandStart > 0, "expand() must document no auto-focus");
    const expandEnd = provider.indexOf("collapse:", expandStart);
    assert.ok(expandEnd > expandStart);
    const expandBody = provider.slice(expandStart, expandEnd);
    assert.ok(
      !/focus-pillow|dispatchEvent/.test(expandBody),
      "expand() must not dispatch focus-pillow — that traps Executive Home scroll on mount",
    );
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
    assert.match(sidebar, /fixed/);
    assert.match(sidebar, /h-dvh|h-screen/);
    assert.match(sidebar, /z-50/);
    assert.match(sidebar, /pointer-events-auto/);
    const shell = readFileSync(
      join(root, "components/cockpit/shell/CockpitShell.tsx"),
      "utf8",
    );
    assert.match(shell, /lg:pl-64|lg:pl-\[72px\]/);
    // overflow-x-hidden computes overflow-y:auto (CSS) and creates a rival scroller.
    assert.match(shell, /overflow-x-clip/);
    assert.ok(!/overflow-x-hidden/.test(shell));
    assert.match(shell, /data-scroll-owner="page"/);
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
