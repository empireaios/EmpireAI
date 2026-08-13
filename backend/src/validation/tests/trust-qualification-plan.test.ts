import assert from "node:assert/strict";
import { describe, test } from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const harnessUrl = pathToFileURL(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../scripts/empireai-trust-qualification.mjs",
  ),
).href;

describe("Trust qualification plan", () => {
  test("defaults to exactly 1000 diversified operations", async () => {
    const mod = (await import(harnessUrl)) as {
      buildPlan: (target?: number) => Record<string, number>;
    };
    const plan = mod.buildPlan(1000);
    const sum = Object.values(plan).reduce((a: number, b: number) => a + b, 0);
    assert.equal(sum, 1000);
    for (const key of [
      "TQ-A",
      "TQ-B",
      "TQ-C",
      "TQ-D",
      "TQ-E",
      "TQ-F",
      "TQ-G",
      "TQ-H",
      "TQ-I",
      "TQ-J",
    ]) {
      assert.ok(plan[key]! >= 1, `${key} must be present`);
    }
    // Must not be a pure liveness hammer.
    assert.ok(plan["TQ-A"]! < 1000);
    assert.ok(plan["TQ-B"]! >= 50);
    assert.ok(plan["TQ-D"]! >= 10);
    assert.ok(plan["TQ-H"]! >= 10);
  });
});
