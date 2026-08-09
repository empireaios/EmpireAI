import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveKpiDisplayValue } from "./resolve-kpi-values";
import type { CockpitKpiDefinition } from "./registry";

const liveKpi: CockpitKpiDefinition = {
  id: "K-E-001",
  label: "GMV MTD",
  dataMode: "live",
  screens: ["SCR-001"],
  placeholderValue: "$1.24M",
  placeholderTrend: "▲",
};

describe("resolveKpiDisplayValue", () => {
  it("never returns placeholder values for LIVE KPIs", () => {
    const result = resolveKpiDisplayValue(liveKpi, []);
    assert.equal(result.value, "Not yet measured");
    assert.notEqual(result.value, liveKpi.placeholderValue);
  });
});
