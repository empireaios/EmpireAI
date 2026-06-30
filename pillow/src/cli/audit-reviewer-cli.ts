import { startPillow } from "../session.js";

const session = await startPillow();
const state = session.auditReviewer.getState();

console.log("Pillow Executive Audit Reviewer (PILLOW-009)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Audit Standard: ${state.auditStandardPath}`);
console.log(`  Total reviews: ${state.totalReviews}`);

const doc = session.planner.generateNextMission();
if (doc) {
  const launch = session.supervisor.launchMission({ document: doc });
  const mission = launch.mission;

  session.supervisor.recordMissionProgress(mission.id, {
    kind: "validation_executed",
    detail: "80/80 pass",
  });
  session.supervisor.recordMissionProgress(mission.id, {
    kind: "executive_audit_generated",
    detail: "Executive Audit produced",
  });
  session.supervisor.transitionMission(mission.id, "executive_audit");

  const auditText = `# Executive Audit — ${mission.id}

## Summary
Mission implementation complete.

## Owner Justification
Owner: Pillow Architecture — canonical runtime location per PILLOW Architecture Contract.

## Validation
npm run pillow:typecheck pass · npm run pillow:test 80/80 pass

## Acceptance criteria
All acceptance criteria met and verified.

## Repository continuity
Repository unchanged except intended engineering mission files. Read-only governance verified.

## Executive Recommendation
Accept mission completion.

## Future Enhancements
Non-blocking improvements registered in PILLOW Enhancement Register.`;

  const review = await session.auditReviewer.reviewMission({
    mission: session.supervisor.getMission(mission.id)!,
    auditText,
    typecheckPassed: true,
    buildPassed: true,
  });

  console.log(`\n  Mission: ${review.record.missionId}`);
  console.log(`  Decision: ${review.record.decision}`);
  console.log(`  Approved: ${review.approved}`);
  console.log(`  Categories: ${review.record.categories.length}`);
  console.log(`  Acceptance criteria: ${review.record.acceptanceCriteria.length}`);
  console.log(`  Recommendations: ${review.record.recommendations.length}`);
  console.log(`  Reasoning: ${review.record.reasoning}`);
} else {
  console.log("\n  No mission available for review demo");
}
