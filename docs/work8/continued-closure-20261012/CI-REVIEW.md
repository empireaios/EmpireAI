# Independent CI correction review

Root reviewed author candidate `8388bde99c5b0af7a73c04f3d456543a73260e38`, tree `0967732205ca070271b990124d20ce90c74c6cdc`, against `8277718e03a0e5d9b612dbe1240bb4a005e56856`.

APPROVE_SCOPED_LOCAL: generated corpus commands are moved into separate required matrix jobs with unchanged scripts and no limiting argument. Both matrix members are required by the final aggregate result; failure, cancellation or skip cannot pass the gate. Existing runtime/session TAP checks, web and Railpack gates remain. Both generated jobs retain the prior exact-source checkout, environment and build dependencies. Scripts independently create disposable state, clear environment, intercept provider HTTP and prohibit external socket connections; no shared preceding test state is required. Source SHA and corpus receipts are retained. No production implementation or test acceptance threshold changes.

GitHub run 38264268728 reached the 30-minute runtime job limit after complete generated admission and delivery steps consumed about 25 minutes. The final runtime/session suite began at 15:07:11Z and was cancelled at 15:07:44Z. Hosted execution of the revised workflow remains pending fresh source publication authority. Existing three passing workflows are preserved; this review is not a fourth hosted CI PASS and does not close original requirement 42.
