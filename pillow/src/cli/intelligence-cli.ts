#!/usr/bin/env node
import { startPillow } from "../session.js";
import { formatQueryAnswer, queryRepository } from "../intelligence/query.js";

const args = process.argv.slice(2);
const queryIndex = args.indexOf("--query");
const query =
  queryIndex >= 0 ? args.slice(queryIndex + 1).join(" ") : null;

const session = await startPillow();
const { bootstrap, intelligence } = session;

console.log("Pillow Repository Intelligence (PILLOW-003)");
console.log(`  Repository: ${bootstrap.repositoryRoot}`);
console.log(`  Entities classified: ${intelligence.graphSummary.nodeCount}`);
console.log(`  Relationships: ${intelligence.graphSummary.edgeCount}`);
console.log(`  Dependencies: ${intelligence.graphSummary.dependencyCount}`);
console.log(`  Health score: ${intelligence.health.score}/100`);
console.log(`  Health issues: ${intelligence.health.issues.length}`);
console.log(`  Duration: ${intelligence.durationMs}ms (intelligence)`);

if (query) {
  console.log("");
  const result = queryRepository(
    query,
    { entities: intelligence.entities, bootstrap },
    intelligence.relationships,
    intelligence.dependencies,
  );
  if (!result.matched) {
    console.log(`No matching query handler for: "${query}"`);
    process.exit(1);
  }
  for (const answer of result.answers) {
    console.log(formatQueryAnswer(answer));
  }
}

process.exit(0);
