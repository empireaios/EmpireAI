import { randomUUID } from "node:crypto";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { AuditLogEntry } from "../../../brain/types.js";
import { captureSoulRuntimeMemory } from "../../soul-file/services/soul-file-service.js";
import type { SoulRuntimeCaptureInput, SoulRuntimeEvent } from "../models/soul-runtime-event.js";
import {
  createSoulRuntimeEvent,
  getSoulRuntimeRepository,
} from "../repositories/sqlite-soul-runtime-repository.js";
import { mapAuditEntryToCaptures } from "./soul-runtime-audit-mapper.js";

let engineInstance: SoulRuntimeEngine | null = null;

export function getSoulRuntimeEngine(): SoulRuntimeEngine {
  if (!engineInstance) {
    engineInstance = new SoulRuntimeEngine();
  }
  return engineInstance;
}

export function resetSoulRuntimeEngine(): void {
  engineInstance = null;
}

/** Living runtime that evolves the Soul File from meaningful Empire events. */
export class SoulRuntimeEngine {
  private auditUnhook: (() => void) | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  attachAuditLogger(auditLogger: AuditLogger): void {
    this.auditUnhook?.();
    const originalWrite = auditLogger.write.bind(auditLogger);
    auditLogger.write = (entry) => {
      const record = originalWrite(entry);
      this.handleAuditEntry(record);
      return record;
    };
    this.auditUnhook = () => {
      auditLogger.write = originalWrite;
    };
  }

  stop(): void {
    this.auditUnhook?.();
    this.auditUnhook = null;
  }

  handleAuditEntry(entry: AuditLogEntry): SoulRuntimeEvent[] {
    if (!this.enabled || !entry.workspaceId) {
      return [];
    }

    const captures = mapAuditEntryToCaptures(entry);
    const results: SoulRuntimeEvent[] = [];

    for (const capture of captures) {
      results.push(this.capture(capture));
    }

    return results;
  }

  capture(input: SoulRuntimeCaptureInput): SoulRuntimeEvent {
    const repository = getSoulRuntimeRepository();
    const event = createSoulRuntimeEvent({
      eventId: randomUUID(),
      workspaceId: input.workspaceId,
      memoryKey: input.memoryKey,
      title: input.title,
      summary: input.summary,
      source: input.source,
      correlationId: input.correlationId,
      auditAction: input.auditAction,
      payload: input.payload,
    });

    const soulFile = captureSoulRuntimeMemory({
      workspaceId: input.workspaceId,
      memoryKey: input.memoryKey,
      actor: input.actor ?? "soul-runtime",
      entry: {
        entryId: event.eventId,
        title: input.title,
        summary: input.summary,
        correlationId: input.correlationId,
        source: input.source,
        payload: input.payload,
        recordedAt: event.recordedAt,
      },
      operationalState: input.operationalState,
      continuity: input.continuity,
      metadata: input.metadata,
    });

    event.soulFileVersion = soulFile.version;
    repository.saveEvent(event);
    return event;
  }
}

export function captureSoulRuntimeEvent(
  input: SoulRuntimeCaptureInput,
): SoulRuntimeEvent {
  return getSoulRuntimeEngine().capture(input);
}

export function listSoulRuntimeEvents(workspaceId: string, limit = 100): SoulRuntimeEvent[] {
  return getSoulRuntimeRepository().listEvents(workspaceId, limit);
}

export function getSoulRuntimeEvent(eventId: string): SoulRuntimeEvent | null {
  return getSoulRuntimeRepository().getEventById(eventId);
}
