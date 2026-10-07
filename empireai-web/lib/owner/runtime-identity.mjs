// Explicit deployment manifest: advance only to the reviewed backend release.
// A historical revision is not proof of the current production release.
export const expectedBackendRevision = 'ac5e117df745767cb5dd50d7f00c5eaf787fbb64';
export function verifyOwnerRuntime(identity, state) {
  return identity?.deploy?.gitCommitSha === expectedBackendRevision &&
    state?.ready === true && state?.birth === 'NOT_BORN' &&
    state?.commerce === 'LOCKED' && state?.operational === false &&
    state?.readinessScope === 'transport_and_storage_only';
}
