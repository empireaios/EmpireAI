/**
 * Version history service — append-only, never rewrite history.
 */

import {
  EMPIREAI_VERSION_1_0,
  EMPIREAI_VERSION_1_0_DISPLAY,
  EMPIRE_VERSION_GOVERNANCE_MISSION_ID,
  type VersionHistoryEntry,
} from "../contracts/version-governance-types.js";
import { EMPIRE_V1_RELEASE_DATE } from "./version-1-certification-service.js";

const VERSION_HISTORY: VersionHistoryEntry[] = [];

function seedVersion1HistoryEntry(): VersionHistoryEntry {
  return {
    entryNumber: 1,
    version: EMPIREAI_VERSION_1_0,
    displayName: EMPIREAI_VERSION_1_0_DISPLAY,
    status: "LOCKED",
    releaseDate: EMPIRE_V1_RELEASE_DATE,
    missionId: EMPIRE_VERSION_GOVERNANCE_MISSION_ID,
    appendOnly: true,
    recordedAt: new Date().toISOString(),
  };
}

export function getVersionHistory(): readonly VersionHistoryEntry[] {
  if (VERSION_HISTORY.length === 0) {
    VERSION_HISTORY.push(seedVersion1HistoryEntry());
  }
  return [...VERSION_HISTORY];
}

export function getVersionHistoryEntry(entryNumber: number): VersionHistoryEntry | undefined {
  return getVersionHistory().find((e) => e.entryNumber === entryNumber);
}

export function appendVersionHistoryEntry(entry: Omit<VersionHistoryEntry, "appendOnly">): VersionHistoryEntry {
  const record: VersionHistoryEntry = { ...entry, appendOnly: true };
  VERSION_HISTORY.push(record);
  return record;
}

export function resetVersionHistoryForTests(): void {
  VERSION_HISTORY.length = 0;
}

export function getVersion1HistoryEntry(): VersionHistoryEntry {
  const history = getVersionHistory();
  const entry = history.find((e) => e.version === EMPIREAI_VERSION_1_0);
  if (!entry) {
    return seedVersion1HistoryEntry();
  }
  return entry;
}
