# Amazon credential provisioning hold

Owner requested only creation of `ci/provider-readback-amazon-v1` so environment `empireai-readonly-amazon` matches one branch. Based on verified code c69d809 and canonical handoff 0b26c37. The provider workflow observe job is unconditionally disabled on this branch, including reruns; adding secrets does not enable it. No provider calls or production actions are authorized by this checkpoint. Vercel deployment remains disabled for this exact branch.

Next: owner enters the four environment secrets securely and reports readiness without values. Work must review and explicitly re-enable the bounded read-only probe in a subsequent commit before it can run. CJ branch remains uncreated. NOT_BORN / LOCKED unchanged.
