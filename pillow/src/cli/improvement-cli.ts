import { startPillow } from "../session.js";

const session = await startPillow();
const engine = session.improvement;
const state = engine.getState();

console.log("Pillow Autonomous Improvement Engine (PILLOW-012)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Doctrine: ${state.doctrinePath}`);
console.log(`  Total batches: ${state.totalBatches}`);

const result = await engine.generateImprovements({ runDueDiligence: true });
const batch = result.batch;

console.log(`\n  Batch: ${batch.batchId}`);
console.log(`  Observations: ${batch.observationCount}`);
console.log(`  Proposals: ${batch.proposals.length}`);
console.log(`  Duration: ${batch.durationMs}ms`);
console.log(`  Recommendation: ${result.recommendation}`);

for (const proposal of batch.proposals.slice(0, 5)) {
  console.log(`\n  [${proposal.recommendedPriority.toUpperCase()}] ${proposal.title}`);
  console.log(`    Domain: ${proposal.domain}`);
  console.log(`    Readiness: ${proposal.readiness}`);
  console.log(`    Evidence: ${proposal.repositoryEvidence.length} item(s)`);
  console.log(`    Owners: ${proposal.affectedOwners.join(", ")}`);
  console.log(`    Sequence: ${proposal.recommendedMissionSequence.join(" → ")}`);
}

if (batch.proposals.length > 0) {
  const first = batch.proposals[0]!;
  console.log(`\n  Simulating Grand King approval for: ${first.proposalId.slice(0, 8)}…`);
  const { approval, recommendation } = engine.submitApproval(
    first.proposalId,
    "approved",
    "Executive review — proceed to mission planning when ready",
  );
  console.log(`  Outcome: ${approval.outcome}`);
  console.log(`  Mission-ready: ${engine.isReadyForMissionGeneration(first.proposalId)}`);
  console.log(`  Gate: ${recommendation}`);
}
