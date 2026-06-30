import type { Doctrine, DoctrineLifecycleRecord } from "../models/doctrine.js";

export interface DoctrineRepository {
  saveDoctrine(doctrine: Doctrine): Doctrine;
  getDoctrineById(doctrineId: string): Doctrine | null;
  listDoctrines(workspaceId: string, status?: string): Doctrine[];

  appendLifecycle(record: DoctrineLifecycleRecord): DoctrineLifecycleRecord;
  listLifecycle(doctrineId: string, limit?: number): DoctrineLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): DoctrineLifecycleRecord[];
}
