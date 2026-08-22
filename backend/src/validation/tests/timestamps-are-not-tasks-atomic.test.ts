/**
 * TIMESTAMPS_ARE_NOT_TASKS — chronology/evidence stamps must not become obligations.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractConsecutiveSectionRun,
  lineStartsWithTemporalStamp,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { detectExpectedTopLevelSections } from "../../orchestration/pillow-host/executive-section-contract.js";
import { isScopedAwayFromLiveEmpire } from "../../orchestration/pillow-host/executive-scoped-reasoning.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_ts_tasks",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_ts",
      asin: "B0TS",
      productName: "Live Bound Widget",
      supplier: "SupplierX",
      marketplace: "Amazon US",
      selectionAuthority: "pillow",
      cursorSelected: false,
      stage: "COMMISSIONING",
      pillowRecommendation: "INVESTIGATE",
      truthClass: "CURRENT_VERIFIED",
    },
    financial: {
      orders: 0,
      realisedRevenueUsd: 0,
      buyableListings: 0,
      publishedListings: 0,
      expectedProfitDisplay: null,
      expectedProfitTruthClass: "UNKNOWN",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "deadbeefcafe0ts",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer", "Recommend"],
      requiresGrandKing: ["Spend", "Publish", "Birth", "Deploy"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
  } as ExecutiveTruthSnapshot;
}

const DOMAINS = [
  "industrial plant analysis",
  "maritime logistics analysis",
  "clinical operations analysis",
  "civic infrastructure analysis",
  "laboratory process analysis",
] as const;

describe("Timestamps are not tasks — atomic", () => {
  it("lineStartsWithTemporalStamp covers common chronology forms", () => {
    assert.equal(lineStartsWithTemporalStamp("08:00 Pump dropped"), true);
    assert.equal(lineStartsWithTemporalStamp("9:10 cooler tripped"), true);
    assert.equal(lineStartsWithTemporalStamp("14:30:05 note filed"), true);
    assert.equal(lineStartsWithTemporalStamp("2026-03-12 14:30 audit"), true);
    assert.equal(lineStartsWithTemporalStamp("12 Mar 2026 08:00 event"), true);
    assert.equal(lineStartsWithTemporalStamp("1) Timeline summary"), false);
    assert.equal(lineStartsWithTemporalStamp("1. Causal chain"), false);
    assert.equal(lineStartsWithTemporalStamp("Item 1 cost $400"), false);
  });

  it("randomized timestamped packs: task count = requested sections; stamps never tasks", () => {
    let pass = 0;
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(91000 + i);
      const sections = 4 + Math.floor(rng() * 4); // 4..7
      const domain = pick(rng, DOMAINS);
      const stampCount = 5 + Math.floor(rng() * 8);
      const stamps: string[] = [];
      let h = 7 + Math.floor(rng() * 3);
      let m = Math.floor(rng() * 50);
      for (let s = 0; s < stampCount; s++) {
        m += 5 + Math.floor(rng() * 20);
        if (m >= 60) {
          h += 1;
          m -= 60;
        }
        const form = i % 5;
        if (form === 0) stamps.push(`${pad(h)}:${pad(m)} Event ${s + 1} observed on Node${pick(rng, ["A", "B", "C"])}.`);
        else if (form === 1) stamps.push(`${h}:${pad(m)} Transfer completed; reading ${40 + s}.`);
        else if (form === 2)
          stamps.push(`2026-0${1 + (i % 9)}-${pad(10 + (i % 18))} ${pad(h)}:${pad(m)} stamped observation ${s + 1}.`);
        else if (form === 3) stamps.push(`${pad(h)}:${pad(m)}:00 Sensor spike recorded.`);
        else stamps.push(`${pad(h)}:${pad(m)} AM Local check-in for unit ${s + 1}.`);
      }
      const sectionLines = Array.from({ length: sections }, (_, n) => {
        const titles = [
          "Timeline summary",
          "Causal chain",
          "Contradictions",
          "What is unknown",
          "Strongest supported conclusion",
          "Next verification",
          "Risk ranking",
        ];
        return `${n + 1}) ${titles[n] ?? `Section ${n + 1}`}`;
      });
      const money = i % 3 === 0 ? [`Item 1 cost $${100 + i}. Item 2 cost $${50 + i}.`] : [];
      const causal =
        i % 2 === 0
          ? [`North pressure drop triggered failover to East; East then overloaded PeerNode.`]
          : [];
      const table =
        i % 4 === 0
          ? [`| Time | Reading |`, `| ${pad(h)}:${pad(m)} | ${20 + i} |`]
          : [];
      const prompt = [
        `SyntheticCanaryStamp-${i} — ${domain} only. Do not mention Mini Fan or Birth.`,
        `Answer in exactly ${sections} numbered sections:`,
        ...sectionLines,
        `Evidence log:`,
        ...stamps,
        ...money,
        ...causal,
        ...table,
        i % 5 === 0 ? `Later note: 09:55 correction — earlier 08:20 reading was sensor noise.` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const expected = detectExpectedTopLevelSections(prompt);
      const c = parseExecutiveTaskContract(prompt);
      const stampTasks = c.tasks.filter(
        (t) =>
          /^\d{2}\s/.test(t.sourceSpan) ||
          lineStartsWithTemporalStamp(t.sourceSpan) ||
          /\b\d{1,2}:\d{2}\b/.test(t.id),
      );
      const fabricated =
        expected != null ? Math.max(0, c.tasks.filter((t) => t.id.startsWith("t")).length - expected) : 0;
      // Additive ensureKind may add recommendation etc. — stamp-derived tasks must be zero.
      const ok =
        expected === sections &&
        stampTasks.length === 0 &&
        c.tasks.filter((t) => /^t\d+$/.test(t.id)).length === sections &&
        isScopedAwayFromLiveEmpire(c.scopeType!) &&
        extractConsecutiveSectionRun(prompt, sections)?.length === sections;

      if (ok && fabricated === 0) pass++;
    }
    assert.equal(pass, 100, `pass=${pass}/100`);
  });

  it("control: timestamps inside evidence body of a real section stay non-obligations", () => {
    const prompt = [
      `SyntheticCanaryStampControl — industrial analysis only. Do not mention Mini Fan.`,
      `Answer in exactly 3 numbered sections:`,
      `1) Summary of the 08:00–09:40 window`,
      `2) Causal reading`,
      `3) Unknowns`,
      `Evidence: 08:00 start; 08:20 transfer; 09:40 restore.`,
    ].join("\n");
    const c = parseExecutiveTaskContract(prompt);
    assert.equal(c.tasks.filter((t) => /^t\d+$/.test(t.id)).length, 3);
    assert.ok(c.tasks.some((t) => /08:00–09:40|08:00-09:40|window/i.test(t.sourceSpan)));
    assert.equal(
      c.tasks.filter((t) => /^(?:00|20|40)\s/.test(t.sourceSpan)).length,
      0,
    );
  });

  it("release+polish on timestamped synthetic pack: no Mini Fan / Birth / realised-orders contamination", () => {
    const prompt = [
      `SyntheticCanaryStampRelease — maritime analysis only. Do not mention Mini Fan or Birth.`,
      `Answer in exactly 6 numbered sections:`,
      `1) Timeline summary`,
      `2) Causal chain`,
      `3) Contradictions`,
      `4) What is unknown`,
      `5) Strongest supported conclusion`,
      `6) Next verification`,
      `08:00 Berth sensor dropped.`,
      `08:20 Crane transferred load to PierB.`,
      `09:10 PierB overload alarm.`,
      `09:40 Service restored.`,
    ].join("\n");
    const released = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt });
    const out = polishFinalVisibleAnswer(released.message, prompt);
    assert.doesNotMatch(out, /Mini Fan/i);
    assert.doesNotMatch(out, /\bBirth\b/);
    assert.doesNotMatch(out, /realised orders|realised revenue remain zero/i);
    const c = parseExecutiveTaskContract(prompt);
    assert.equal(c.tasks.filter((t) => /^t\d+$/.test(t.id)).length, 6);
  });
});
