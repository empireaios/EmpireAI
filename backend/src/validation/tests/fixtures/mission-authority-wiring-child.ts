import path from "node:path";
import { createMissionRuntime } from "@empireai/pillow";
import { env } from "../../../config/env.js";
import { PillowHost } from "../../../orchestration/pillow-host/pillow-host.js";
import { createMissionExecutionService } from "../../../orchestration/pillow-host/mission-execution/service.js";
import { AUTHORITY_WORKER } from "../../../orchestration/pillow-host/mission-execution/contract.js";
const [directory, phase] = process.argv.slice(2);
const scope = { workspaceId: "ws_empire_1" as const, ownerEmail: env.FOUNDER_EMAIL.trim().toLowerCase() };
const engine = createMissionRuntime({ repositoryRoot: path.resolve("..") } as any,
 { persistenceFile: path.join(directory!, "brain.db.missions.sqlite"), persistenceScope: scope });
await engine.initialize();
const host = new PillowHost(); host.lifecycle = "running"; host.pillowSession = { missionRuntime: engine, contextBuilder: {} } as any;
const service = createMissionExecutionService({ databasePath: path.join(directory!, "brain.db"), scope, buildSha: "a".repeat(40), host });
const held = () => { process.stdout.write(`HELD_${phase}\n`); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0); throw new Error("Unexpected unblock"); };
if (phase === "intent") engine.bindIntegrations({ authorityMissionExecutor: { ...service.adapter, enqueue: held } });
if (phase === "output") host.reconcileMissionAuthorityExecution = held;
engine.execute({ workers: [AUTHORITY_WORKER], pillowConfirmed: true, grandKingApproved: true, validated: true });
service.runner.resume(); await service.runner.tick();
