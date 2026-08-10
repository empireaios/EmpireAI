import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  classifyGrandKingUxFinding,
  GRAND_KING_UX_DEFECT_CLASSES,
} from "./grand-king-ux-defect-class";

describe("Mission 006 Grand King UX defect classes (web)", () => {
  it("classifies blockers vs polish", () => {
    assert.equal(classifyGrandKingUxFinding({ navigationBroken: true }), "CLASS_1");
    assert.equal(classifyGrandKingUxFinding({ hierarchyPoor: true }), "CLASS_2");
    assert.equal(classifyGrandKingUxFinding({ aestheticOnly: true }), "CLASS_3");
    assert.equal(GRAND_KING_UX_DEFECT_CLASSES.CLASS_1.title, "Operational blocker");
  });

  it("commissioning strip surfaces winning purpose fields", () => {
    const strip = readFileSync(
      join(process.cwd(), "components/cockpit/executive/PillowCommissioningStrip.tsx"),
      "utf8",
    );
    assert.match(strip, /winningOperatingQuestion/);
    assert.match(strip, /Winning purpose/);
  });
});
