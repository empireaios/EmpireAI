import type { EmpireDatabase } from "../../brain/sqlite-database.js";
import type { SqliteShadowCeoRepository } from "../shadow-ceo/repository.js";

/** Hold both candidate SQL.js handles through the caller's disk verification.
 * The caller must separately drain HTTP, background jobs, JSON/native stores,
 * Redis and other processes. This is not a production or whole-app snapshot.
 */
export async function withQuiescedBrainAndShadowCapture<T>(
  brain: EmpireDatabase,
  shadow: SqliteShadowCeoRepository,
  captureAndVerify: () => T | Promise<T>,
): Promise<T> {
  const releaseBrain = brain.holdWritesForCapture();
  let shadowFence: ReturnType<SqliteShadowCeoRepository["acquireCaptureFence"]> | undefined;
  try {
    // Fence both synchronously before the first save yields to another writer.
    shadowFence = shadow.acquireCaptureFence();
    await brain.requestCriticalPersist();
    await shadowFence.persist();
    return await captureAndVerify();
  } finally {
    try { shadowFence?.release(); }
    finally { releaseBrain(); }
  }
}
