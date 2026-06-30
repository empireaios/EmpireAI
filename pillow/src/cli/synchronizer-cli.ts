import { startPillow } from "../session.js";

const session = await startPillow();
const state = session.synchronizer.getState();

console.log("Pillow Repository Synchronizer (PILLOW-010)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Doctrines: ${state.doctrinePaths.join(", ")}`);
console.log(`  Total syncs: ${state.totalSyncs}`);

const preview = await session.synchronizer.previewSync({
  missionId: "PILLOW-010",
  missionTitle: "Repository Synchronizer",
  auditApproved: true,
});

console.log(`\n  Preview ID: ${preview.preview.previewId}`);
console.log(`  Changes detected: ${preview.preview.changes.length}`);
console.log(`  Proposals: ${preview.preview.proposals.length}`);
console.log(`  Affected files: ${preview.preview.affectedFiles.join(", ") || "none"}`);
console.log(`  Approval required: ${preview.preview.approvalRequired}`);
console.log(`  Recommendation: ${preview.recommendation}`);

for (const p of preview.preview.proposals.slice(0, 3)) {
  console.log(`\n  — ${p.artifact.label} (${p.artifact.owner})`);
  console.log(`    Reason: ${p.reason.slice(0, 80)}…`);
  console.log(`    Type: ${p.changeType} · ${p.requirement}`);
}

const deferred = await session.synchronizer.synchronize(
  { missionId: "PILLOW-010-demo", trigger: "governance_change" },
  "deferred",
);

console.log(`\n  Deferred sync executed: ${deferred.record.executed}`);
console.log(`  Dry run: ${deferred.record.dryRun}`);
