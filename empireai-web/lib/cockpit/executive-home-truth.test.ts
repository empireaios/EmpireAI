import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveKpiDisplayValue } from "@/lib/cockpit/kpis/resolve-kpi-values";
import { COCKPIT_UX_NAVIGATION } from "@/lib/cockpit-ux/navigation";

const PROHIBITED =
  /Awaiting implementation|coming soon|TBD|lorem ipsum|dummy data|mock LIVE|fixture/i;

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
});
