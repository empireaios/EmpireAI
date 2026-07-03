import type { EngineeringPlan, RootCauseAnalysis, SystemDiagnosis } from "./types.js";

export function buildEngineeringPlan(
  problemDescription: string,
  diagnosis: SystemDiagnosis,
  rootCause: RootCauseAnalysis,
): EngineeringPlan {
  const normalized = problemDescription.toLowerCase();
  const primaryModule = diagnosis.affectedModules[0] ?? "empireai-web/lib/pillow/client.ts";

  let recommendedSolution =
    "Implement minimal fix at identified root module; validate via typecheck, tests, and production health endpoints.";
  const alternativeSolutions: string[] = [
    "Fallback to Brain dispatch-only mode while Pillow host recovers",
    "Hotfix deployment with governance bundle resync if bootstrap-related",
  ];
  const requiredFiles = [...new Set(diagnosis.affectedModules)].slice(0, 8);
  const steps: EngineeringPlan["steps"] = [];

  if (/failed to fetch|session|auth race/i.test(normalized + rootCause.rootCause)) {
    recommendedSolution =
      "Gate Pillow session creation behind CockpitAuthGuard; add fetch retry to pillow client; verify POST /api/pillow/session returns 201 with authenticated cookie.";
    requiredFiles.push(
      "empireai-web/lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx",
      "empireai-web/components/cockpit/shell/CockpitShell.tsx",
      "empireai-web/lib/pillow/client.ts",
    );
    steps.push(
      {
        order: 1,
        action: "Move GlobalAiAssistantProvider inside CockpitAuthGuard",
        files: ["empireai-web/components/cockpit/shell/CockpitShell.tsx"],
        rationale: "Prevent session POST before auth verified",
      },
      {
        order: 2,
        action: "Add retry with backoff to pillowRequest",
        files: ["empireai-web/lib/pillow/client.ts"],
        rationale: "Match brainDispatch resilience for transient failures",
      },
      {
        order: 3,
        action: "Validate POST /api/pillow/session and chat flow on production",
        files: ["empireai-web/app/api/pillow/[...path]/route.ts"],
        rationale: "Confirm BFF proxy and Railway PillowHost accept sessions",
      },
    );
  } else if (/502|504|timeout|proxy|BRAIN_API/i.test(normalized + rootCause.rootCause)) {
    recommendedSolution =
      "Fix Vercel BRAIN_API_URL to production Railway URL; add upstream timeout in server-proxy; set route maxDuration.";
    requiredFiles.push(
      "empireai-web/lib/brain/server-proxy.ts",
      "empireai-web/vercel.json",
      "empireai-web/lib/brain/route-config.ts",
    );
    steps.push(
      {
        order: 1,
        action: "Resolve BRAIN_API_URL for Vercel production",
        files: ["empireai-web/lib/brain/server-proxy.ts", "empireai-web/vercel.json"],
        rationale: "Prevent localhost proxy hang",
      },
      {
        order: 2,
        action: "Apply shared route config with maxDuration 60",
        files: ["empireai-web/lib/brain/route-config.ts"],
        rationale: "Allow long-running Brain/Pillow upstream calls",
      },
    );
  } else if (/503|bootstrap|governance/i.test(normalized + rootCause.rootCause)) {
    recommendedSolution =
      "Run sync-pillow-governance in Railway build; commit missing doctrines; verify executive self-assessment passes.";
    requiredFiles.push(
      "scripts/sync-pillow-governance.mjs",
      "backend/.pillow-governance-bundle",
      "backend/src/orchestration/pillow-host/resolve-repo-root.ts",
    );
    steps.push(
      {
        order: 1,
        action: "Sync governance bundle before Railway build",
        files: ["scripts/sync-pillow-governance.mjs"],
        rationale: "Ensure Pillow bootstrap finds required knowledge files",
      },
      {
        order: 2,
        action: "Redeploy Railway and verify /api/pillow/health lifecycle running",
        files: ["deployment/MANAGED_DEPLOYMENT.md"],
        rationale: "Confirm PillowHost operational",
      },
    );
  } else {
    steps.push(
      {
        order: 1,
        action: "Reproduce issue locally with pillow intelligence CLI",
        files: ["pillow/src/cli/intelligence-cli.ts"],
        rationale: "Confirm symptom against repository knowledge model",
      },
      {
        order: 2,
        action: "Implement fix in primary affected module",
        files: [primaryModule],
        rationale: rootCause.rootCause,
      },
      {
        order: 3,
        action: "Run typecheck, tests, and production verification",
        files: ["pillow/package.json", "backend/package.json", "empireai-web/package.json"],
        rationale: "Technical Chief validation gate",
      },
    );
  }

  return {
    recommendedSolution,
    alternativeSolutions,
    steps,
    requiredFiles: [...new Set(requiredFiles)],
    expectedChanges: steps.flatMap((s) => s.files),
    acceptanceCriteria: [
      "No Failed to fetch or equivalent browser network error in Pillow Operating Shell",
      "All Pillow shell API requests return 2xx within timeout budget",
      "Mission status, alerts, and next action remain visible",
      "Typecheck and validation tests pass",
      "Production /api/pillow/health lifecycle is running",
    ],
    validationPlan: [
      "npm run typecheck in pillow, backend, empireai-web",
      "Run pillow validation test suite",
      "POST /api/auth/login → /api/pillow/session → /api/pillow/chat",
      "GET /api/pillow/health via Vercel BFF",
      "Browser console: zero failed Pillow requests",
    ],
    rollbackStrategy:
      "Revert commit on main; redeploy Vercel and Railway; verify previous health endpoints before re-attempt.",
    deploymentPlan:
      "git push main → Railway backend build (pillow + governance sync) → Vercel frontend build → verify health endpoints.",
  };
}
