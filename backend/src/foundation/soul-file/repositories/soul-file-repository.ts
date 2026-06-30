import type {
  SoulFileChangeRecord,
  SoulFileDocument,
} from "../models/soul-file-document.js";

export interface SoulFileRepository {
  saveSnapshot(document: SoulFileDocument): SoulFileDocument;
  getSnapshotByVersion(workspaceId: string, version: number): SoulFileDocument | null;
  getLatestSnapshot(workspaceId: string): SoulFileDocument | null;
  listSnapshots(workspaceId: string): SoulFileDocument[];

  appendChange(record: SoulFileChangeRecord): SoulFileChangeRecord;
  listChanges(workspaceId: string, limit?: number): SoulFileChangeRecord[];
}
