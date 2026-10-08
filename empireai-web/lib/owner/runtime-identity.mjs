// Explicit deployment manifest: advance only to the reviewed backend release.
// A historical revision is not proof of the current production release.
export const expectedBackendRevision = 'd0d07771c5f64fb363ff2e00e35eb461d898fb14';
export function verifyOwnerRuntime(identity, state) {
  return identity?.deploy?.gitCommitSha === expectedBackendRevision &&
    state?.ready === true && state?.birth === 'NOT_BORN' &&
    state?.commerce === 'LOCKED' && state?.operational === false &&
    state?.readinessScope === 'transport_and_storage_only';
}
