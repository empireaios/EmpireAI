#!/usr/bin/env node
import { startPillow } from "../session.js";

const session = await startPillow();
const commerce = session.commerceIntelligence;
const state = commerce.getState();

console.log("Pillow Commerce Intelligence Executive (PILLOW-CI-001)");
console.log(`  Products: ${state.catalogProducts}`);
console.log(`  Suppliers: ${state.catalogSuppliers}`);
console.log(`  Markets: ${state.catalogMarkets}`);
console.log(`  Quality threshold: ${state.qualityThreshold}`);
console.log("  Analyzing commerce opportunities...");
console.log("");

const report = commerce.analyzeCommerce();
const winners = report.recommendedProducts;

console.log(`Recommended products (above threshold): ${winners.length}`);
for (const w of winners.slice(0, 5)) {
  console.log(`  • ${w.product.name} — composite ${w.compositeScore}`);
}
console.log("");
console.log(report.executiveBrief);

process.exit(winners.length > 0 ? 0 : 1);
