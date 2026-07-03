import { execFileSync } from "node:child_process";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { GitHubOrchestrationSnapshot, HealthStatus } from "./types.js";
import { INFRASTRUCTURE_ENDPOINTS } from "./platform-config.js";

export function orchestrateGitHub(
  bootstrap: EmpireBootstrapContext,
): GitHubOrchestrationSnapshot {
  const findings: string[] = [];
  let available = false;
  let repository: string | null = null;
  let branch: string | null = null;
  let syncStatus: GitHubOrchestrationSnapshot["syncStatus"] = "unknown";
  let uncommittedChanges = 0;
  const recentCommits: string[] = [];
  const openPullRequests: string[] = [];

  try {
    const root = bootstrap.repositoryRoot;
    branch = runGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]).trim() || null;
    const remoteUrl = runGit(root, ["remote", "get-url", INFRASTRUCTURE_ENDPOINTS.github.defaultRemote]).trim();
    repository = parseRepository(remoteUrl);
    available = true;

    const status = runGit(root, ["status", "--porcelain"]);
    uncommittedChanges = status.split("\n").filter(Boolean).length;
    if (uncommittedChanges > 0) {
      findings.push(`${uncommittedChanges} uncommitted change(s) in working tree`);
    }

    syncStatus = detectSyncStatus(root, branch);

    const log = runGit(root, ["log", "-5", "--oneline"]);
    recentCommits.push(...log.split("\n").filter(Boolean));

    openPullRequests.push(...tryGhPrList(root));
  } catch (err) {
    findings.push(`Git unavailable: ${err instanceof Error ? err.message : String(err)}`);
  }

  let releaseReadiness: HealthStatus = "healthy";
  if (uncommittedChanges > 0) releaseReadiness = "degraded";
  if (syncStatus === "diverged" || syncStatus === "behind") releaseReadiness = "degraded";
  if (!available) releaseReadiness = "unknown";

  const health: HealthStatus =
    !available ? "unknown" :
    syncStatus === "diverged" ? "critical" :
    uncommittedChanges > 20 ? "degraded" :
    "healthy";

  return {
    platform: "github",
    available,
    repository,
    branch,
    syncStatus,
    uncommittedChanges,
    recentCommits,
    openPullRequests,
    releaseReadiness,
    health,
    findings,
  };
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 10_000 });
}

function parseRepository(remoteUrl: string): string | null {
  const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/i);
  return (match?.[1] ?? remoteUrl) || null;
}

function detectSyncStatus(
  cwd: string,
  branch: string | null,
): GitHubOrchestrationSnapshot["syncStatus"] {
  if (!branch) return "unknown";
  try {
    const aheadBehind = runGit(cwd, [
      "rev-list",
      "--left-right",
      "--count",
      `${INFRASTRUCTURE_ENDPOINTS.github.defaultRemote}/${branch}...HEAD`,
    ]).trim();
    const parts = aheadBehind.split(/\s+/);
    const behind = parseInt(parts[0] ?? "0", 10);
    const ahead = parseInt(parts[1] ?? "0", 10);
    if (ahead > 0 && behind > 0) return "diverged";
    if (ahead > 0) return "ahead";
    if (behind > 0) return "behind";
    return "synced";
  } catch {
    return "unknown";
  }
}

function tryGhPrList(cwd: string): string[] {
  try {
    const out = execFileSync(
      "gh",
      [
        "pr",
        "list",
        "--limit",
        "5",
        "--json",
        "number,title,state",
        "--jq",
        '.[] | "#\(.number) \(.title) [\(.state)]"',
      ],
      { cwd, encoding: "utf8", timeout: 15_000 },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
