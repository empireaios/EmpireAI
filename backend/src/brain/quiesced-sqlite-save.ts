import type { EmpireDatabase } from "./sqlite-database.js";

/** Save a single already-open SQL.js instance with its writes fenced while a
 * caller verifies a disk copy. This is not whole-application quiescence: the
 * caller must separately stop admission and every other writer/store.
 */
export async function withQuiescedSqliteSave<T>(
  db: EmpireDatabase,
  captureAndVerify: () => T | Promise<T>,
): Promise<T> {
  const release = db.holdWritesForCapture();
  try {
    await db.requestCriticalPersist();
    return await captureAndVerify();
  } finally {
    release();
  }
}
