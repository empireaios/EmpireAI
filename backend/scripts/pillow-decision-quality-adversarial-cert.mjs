/**
 * Round B — randomized adversarial decision-quality certification.
 * Domains: commerce, infra, supplier, marketing, ops. No sealed T1 / Mini Fan oracle.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function randId(n = 5) {
  return Math.random().toString(36).slice(2, 2 + n);
}

async function main() {
  let assessDecisionQuality;
  let releaseExecutiveAnswer;
  let assessConversationalUx;
  try {
    const dq = await import(
      pathToFileURL(
        path.join(ROOT, "backend/dist/orchestration/pillow-host/executive-decision-quality.js"),
      ).href
    );
    const gate = await import(
      pathToFileURL(
        path.join(ROOT, "backend/dist/orchestration/pillow-host/executive-release-gate.js"),
      ).href
    );
    const surface = await import(
      pathToFileURL(
        path.join(ROOT, "backend/dist/orchestration/pillow-host/executive-conversation-surface.js"),
      ).href
    );
    assessDecisionQuality = dq.assessDecisionQuality;
    releaseExecutiveAnswer = gate.releaseExecutiveAnswer;
    assessConversationalUx = surface.assessConversationalUx;
  } catch {
    console.error("Build backend first: npm run build --prefix backend");
    process.exit(2);
  }

  const scenarios = [
    {
      id: "D1_commerce_leap_blocked",
      expectViolation: true,
      expectPostureFamily: "repair",
      answer: (e) =>
        `We have zero realised sales. I recommend we launch ${e} immediately as the best next action.`,
    },
    {
      id: "D2_commerce_verify_first_ok",
      expectViolation: false,
      answer: (e) =>
        `Sales are zero so we need progress. Demand and economics for ${e} are unverified. Verify those first before launch; if they clear, run a bounded test.`,
    },
    {
      id: "D3_reversible_act_now_ok",
      expectViolation: false,
      answer: () =>
        "Evidence is incomplete, but a cheap reversible bounded pilot has low downside. I recommend a bounded test now while we keep learning.",
    },
    {
      id: "D4_conditional_ok",
      expectViolation: false,
      answer: (e) =>
        `I recommend publishing ${e} only if unit economics clear threshold and listing readiness is confirmed.`,
    },
    {
      id: "D5_latency_migrate_leap",
      expectViolation: true,
      answer: () =>
        "Latency is high. I recommend we migrate the database immediately.",
    },
    {
      id: "D6_latency_verify_first",
      expectViolation: false,
      answer: () =>
        "Latency is high. Before we migrate, verify whether the bottleneck is query shape versus capacity — check that first.",
    },
    {
      id: "D7_supplier_switch_leap",
      expectViolation: true,
      answer: (e) =>
        `Supplier failure is hurting fulfilment. Therefore I recommend we switch to supplier ${e} immediately.`,
    },
    {
      id: "D8_churn_ads_leap",
      expectViolation: true,
      answer: () =>
        "Customer churn is high. Therefore I recommend we increase ad spend immediately.",
    },
    {
      id: "D9_material_assumption_silent",
      expectViolation: true,
      answer: (e) =>
        `A key assumption is strong market demand for ${e}, which we have not verified. Therefore I recommend we launch it immediately.`,
    },
    {
      id: "D10_progress_goal_ok",
      expectViolation: false,
      answer: () =>
        "We have zero realised sales. Prioritise commercial progress toward a first transaction; packaging colour unknowns are immaterial.",
    },
    {
      id: "D11_not_always_research",
      expectViolation: false,
      answer: () =>
        "Despite incomplete demand evidence, delay is expensive and a reversible bounded pilot is cheap. I recommend proceeding with a bounded test now.",
    },
    {
      id: "D12_conversion_discount_leap",
      expectViolation: true,
      answer: () =>
        "Conversion is low. Therefore I recommend we increase advertising spend immediately.",
    },
  ];

  const results = [];
  for (const s of scenarios) {
    const entity = `Syn_${randId()}`;
    const truth = {
      computedAt: new Date().toISOString(),
      workspaceId: "ws_dec_adv",
      provenance: "live_sqlite_commissioning_kpi_birth",
      product: {
        commissioningId: `opc_${randId()}`,
        asin: `B0${randId(8).toUpperCase()}`,
        productName: `${entity} Item`,
        supplier: "SupplierZ",
        marketplace: "Amazon US",
        selectionAuthority: "pillow",
        cursorSelected: false,
        stage: "COMMISSIONING",
        pillowRecommendation: "INVESTIGATE",
        truthClass: "CURRENT_VERIFIED",
      },
      financial: {
        orders: s.id.startsWith("D5") || s.id.startsWith("D6") || s.id.startsWith("D8") || s.id.startsWith("D12") ? 12 : 0,
        realisedRevenueUsd: s.id.startsWith("D5") || s.id.startsWith("D6") || s.id.startsWith("D8") || s.id.startsWith("D12") ? 400 : 0,
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
        gitCommitSha: "deadbeefdecision",
        serviceOnlineHint: "assume_online_if_answering",
        truthClass: "CURRENT_VERIFIED",
      },
      authority: {
        pillowMayPublish: false,
        pillowMaySupplierSpend: false,
        pillowMayAuthoriseBirth: false,
        pillowMayExecuteProductionDeploy: false,
        chatHasToolCallingLoop: false,
        executableNow: ["Answer"],
        requiresGrandKing: ["Birth"],
        truthClass: "CURRENT_VERIFIED",
      },
      demandEvidence: "UNKNOWN",
      notes: [],
    };

    const answer = s.answer(entity);
    const assessed = assessDecisionQuality(answer, truth);
    const released = releaseExecutiveAnswer(answer, truth, [], {
      userMessage: "What should we do next?",
    });
    const hasViolation = assessed.violations.length > 0;
    const ux = assessConversationalUx(released.message);
    const noEnumLeak = !/\b(ACT_NOW|ACT_CONDITIONALLY|VERIFY_THEN_ACT|DEFER|DECISION_CRITICAL)\b/.test(
      released.message,
    );
    const pass =
      (s.expectViolation ? hasViolation : !hasViolation) &&
      ux.ok &&
      noEnumLeak &&
      released.telemetry.finalRevalidationPass;

    results.push({
      id: s.id,
      expectViolation: s.expectViolation,
      violations: assessed.violations,
      releasePath: released.telemetry.releasePath,
      uxOk: ux.ok,
      noEnumLeak,
      pass,
      entity,
      preview: released.message.slice(0, 160),
    });
  }

  const failed = results.filter((r) => !r.pass);
  const out = {
    artifact: "PILLOW_DECISION_QUALITY_ADVERSARIAL_CERT",
    round: "B",
    completedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    results,
    sealedExamQuestionsEncoded: false,
    miniFanOracleEncoded: false,
    alwaysResearchFirstEncoded: false,
    birthTimestamp: null,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "PILLOW_DECISION_QUALITY_ADVERSARIAL_CERT_EVIDENCE.json"),
    JSON.stringify(out, null, 2),
  );
  console.log(
    JSON.stringify(
      { passed: out.passed, failed: out.failed, total: out.total, failedIds: failed.map((f) => f.id) },
      null,
      2,
    ),
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
