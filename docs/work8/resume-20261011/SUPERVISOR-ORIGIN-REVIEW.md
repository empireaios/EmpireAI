# Bounded supervisor origin repair

Local source f4981fc186526d92d42066c78bba1e14544ba879, tree9dfb68ee8d70ecdea4d0051866f344934a537fb6, parent published3b5c4cc2ea9e821b62eb9f431aad2696e84cedd6. Four changed files; no deployment. Eight targeted tests PASS under scripts/work8/isolated-exec.py seccomp wrapper, receipt SUPERVISOR-ORIGIN.tap.

Independent read-only reviewer found no blocking defect. Invalid explicit URLs fail before spawn. Only HTTPS root origins without credentials/query/fragment/nondefault port are accepted. Explicit override wins over service public domain; configuration forwards resolved origin. Secret allowlist unchanged; Redis only goes to permanent worker. Reviewer did not rerun tests.

Compatibility fallback still targets production when both inputs are absent. This repairs configuration support, not universal isolation. Hosted preflight must require an explicit trial origin, verify it differs from production, and independently verify isolated Redis/storage. Requirement37 acceptance remains solely attributed to published3b5c, not this unpublished delta.
