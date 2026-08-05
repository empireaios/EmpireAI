import { MEMRT_METADATA_VERSION } from "./paths.js";
import { nextMemrtId } from "./memory-store.js";
import type { MemoryEntry, MemoryVersion } from "./types.js";

export class VersioningEngine {
  createInitialVersion(entry: MemoryEntry, contentRef: string, summary: string): MemoryVersion {
    return {
      versionId: nextMemrtId("memrt-ver"),
      memoryId: entry.memoryId,
      versionNumber: 1,
      contentRef,
      summary,
      createdAt: entry.createdAt,
      supersedesVersion: null,
      parentMemoryId: entry.parentMemoryId,
      metadataVersion: MEMRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  appendVersion(
    entry: MemoryEntry,
    contentRef: string,
    summary: string,
    parentMemoryId: string | null,
  ): { entry: MemoryEntry; newVersion: MemoryVersion } {
    const priorVersions = entry.versions.map((v) => ({ ...v }));
    const nextVersionNumber = entry.currentVersion + 1;
    const newVersion: MemoryVersion = {
      versionId: nextMemrtId("memrt-ver"),
      memoryId: entry.memoryId,
      versionNumber: nextVersionNumber,
      contentRef,
      summary,
      createdAt: new Date().toISOString(),
      supersedesVersion: entry.currentVersion,
      parentMemoryId,
      metadataVersion: MEMRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };

    const updated: MemoryEntry = {
      ...entry,
      contentRef,
      summary,
      currentVersion: nextVersionNumber,
      updatedAt: newVersion.createdAt,
      versions: [...priorVersions, newVersion],
      retentionStatus: entry.retentionStatus === "archived" ? "active" : entry.retentionStatus,
    };

    return { entry: updated, newVersion };
  }

  /** Verify prior version payloads are unchanged after append. */
  verifyHistoricalPreservation(before: MemoryEntry, after: MemoryEntry): boolean {
    for (const prior of before.versions) {
      const match = after.versions.find((v) => v.versionNumber === prior.versionNumber);
      if (!match) return false;
      if (
        match.contentRef !== prior.contentRef ||
        match.summary !== prior.summary ||
        match.createdAt !== prior.createdAt
      ) {
        return false;
      }
    }
    return true;
  }
}
