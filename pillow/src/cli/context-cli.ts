#!/usr/bin/env node
import { startPillow, buildPillowContext } from "../session.js";
import type { ContextTask } from "../context/types.js";

const args = process.argv.slice(2);
const taskIndex = args.indexOf("--task");
const messageIndex = args.indexOf("--message");

const task =
  taskIndex >= 0 ? (args[taskIndex + 1] as ContextTask | undefined) : undefined;
const userMessage =
  messageIndex >= 0 ? args.slice(messageIndex + 1).join(" ") : undefined;

const session = await startPillow();
const context = await buildPillowContext({ task, userMessage });

console.log("Pillow Context Builder (PILLOW-004)");
console.log(`  Task: ${context.manifest.task}`);
console.log(`  Slices: ${context.manifest.sliceCount}`);
console.log(`  Paths: ${context.manifest.paths.join(", ")}`);
console.log(`  Bytes: ${context.manifest.totalBytes}`);
console.log(`  Est. tokens: ${context.manifest.estimatedTokens}`);
console.log(`  Cached: ${context.manifest.cached}`);
console.log(`  Duration: ${context.manifest.durationMs}ms`);
console.log(`  Health: ${context.intelligenceSnapshot.healthScore}/100`);
console.log(`  Mission: ${context.intelligenceSnapshot.currentMission ?? "—"}`);

process.exit(0);
