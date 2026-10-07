// Explicit deployment manifest: advance only to the reviewed backend release.
// A historical revision is not proof of the current production release.
export const expectedBackendRevision = '34bb8bff9e73e5fd1dd43412198920a21597455d';
export function verifyOwnerRuntime(identity, state) {
  return identity?.deploy?.gitCommitSha === expectedBackendRevision &&
    state?.ready === true && state?.birth === 'NOT_BORN' &&
    state?.commerce === 'LOCKED' && state?.operational === false &&
    state?.readinessScope === 'transport_and_storage_only';
}
