import { acquireAuthorityJsonCaptureFence } from "../shadow-ceo-authority/repository/json-authority-store.js";
import { acquireRequestOwnerCaptureFence } from "./request-owner.js";

/** Hold both local JSON authority writers through a caller's capture/readback.
 * External processes and independent native/Redis writers remain outside it.
 */
export async function withLocalJsonAuthorityCapture<T>(capture: () => T | Promise<T>): Promise<T> {
  const releaseOwner = acquireRequestOwnerCaptureFence();
  let releaseAuthority: (() => void) | undefined;
  try {
    releaseAuthority = acquireAuthorityJsonCaptureFence();
    return await capture();
  } finally {
    try { releaseAuthority?.(); }
    finally { releaseOwner(); }
  }
}
