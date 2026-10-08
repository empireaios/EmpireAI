// Explicit deployment manifest: advance only to the reviewed backend release.
// A historical revision is not proof of the current production release.
export const expectedBackendRevision = '3b2599e759264a7d4beb2b570b4a2e68fe5cd29e';
export function verifyOwnerRuntime(identity, state) {
  return identity?.deploy?.gitCommitSha === expectedBackendRevision &&
    state?.ready === true && state?.birth === 'NOT_BORN' &&
    state?.commerce === 'LOCKED' && state?.operational === false &&
    state?.readinessScope === 'transport_and_storage_only';
}
