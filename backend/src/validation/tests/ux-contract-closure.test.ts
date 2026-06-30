import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const FRONTEND = join(ROOT, "frontend/src");

function read(rel: string): string {
  return readFileSync(join(FRONTEND, rel), "utf8");
}

describe("UX Contract Closure — GC-02 / GC-06 / routing verification", () => {
  it("GC-02 — GlobalApprovalBar mounted in DashboardLayout", () => {
    const layout = read("layouts/DashboardLayout.tsx");
    assert.match(layout, /GlobalApprovalBar/);
    assert.match(layout, /gc-02-approval-bar|GlobalApprovalBar/);
    assert.match(layout, /isFounderPersona|isFounder/);
  });

  it("GC-06 — GlobalSuccess001BlockerBar mounted in DashboardLayout", () => {
    const layout = read("layouts/DashboardLayout.tsx");
    assert.match(layout, /GlobalSuccess001BlockerBar/);
    assert.match(layout, /extractSuccess001Blocker|blockerText/);
  });

  it("UX-001 — role-correct post-login routing", () => {
    const dest = read("lib/post-login-destination.ts");
    assert.match(dest, /operator.*brands/s);
    assert.match(dest, /founder.*home|dashboard\.home/s);
    const login = read("pages/auth/LoginPage.tsx");
    assert.match(login, /postLoginDestination/);
  });

  it("GC-01 — canonical nav labels (Mission Home · Product Discovery · Profit & Operating Cost)", () => {
    const pathsFile = read("routes/paths.ts");
    const navSection = pathsFile.slice(pathsFile.indexOf("workspaceNavItems"));
    assert.match(navSection, /Mission Home/);
    assert.doesNotMatch(navSection, /Mission Control/);
    assert.match(navSection, /Product Discovery/);
    assert.doesNotMatch(navSection, /Business Intelligence/);
    assert.match(navSection, /Profit & Operating Cost/);
  });

  it("GC-01 — operator role-gated sidebar items", () => {
    const paths = read("routes/paths.ts");
    assert.match(paths, /roles: \["founder", "admin"\]/);
    const sidebar = read("components/layout/Sidebar.tsx");
    assert.match(sidebar, /item\.roles/);
  });

  it("UX-002 — Mission Home founder-only via RoleBasedHomeRoute", () => {
    const routesFile = read("routes/index.tsx");
    assert.match(routesFile, /RoleBasedHomeRoute/);
    assert.match(routesFile, /FounderRoute/);
  });

  it("shared approval queue — GC-02 live pending count source", () => {
    const queue = read("lib/approval-queue.ts");
    assert.match(queue, /grandKingApprovalQueue/);
    assert.match(queue, /recommendationsAwaitingKing/);
    assert.match(queue, /awaitingApproval/);
  });
});
