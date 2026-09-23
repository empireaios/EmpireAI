# Bounded build repair

Initial deployment c945a744 failed at final image export: `/opt/corepack` did not exist. Node22.23.2/npm10.9.8 guards, Pillow compile and backend compile passed. App never started; no recovery probe ran. Complete build logs are preserved in CANARY_FAILED_BUILD_2026-09-23.json.

Railpack v0.39.0 source and configuration documentation confirm that overriding install.commands removes its Corepack setup while final runtime export still includes the Corepack directory. Fix adds explicit `corepack prepare npm@10.9.8 --activate` before locked npm ci, plus verifier and rejection coverage. No application or probe change.

Source: https://github.com/railwayapp/railpack/blob/v0.39.0/core/providers/node/node.go ; https://railpack.com/config/file

New head59c393a53b64155577de874b97650865a2dfb836 on PR8. Local runtime tests5/5 and actual verify-product-path-ci.mjs PASS. An initial command referenced nonexistent verify-product-contract.mjs and failed before the correct script was run. New CI Product35853242423/Semantic35853242430/Runtime35853242421 running. Railway retry81fd99e8-7b16-42b7-9a7d-42830adc5319 WAITING for CI.

Expiry unchanged2026-09-23T11:58:10.303Z. Redis still running since11:03UTC, all caps/volumes/credentials unchanged. Probe hash unchanged; expected app commit for any eventual probe is now59c393a53b64155577de874b97650865a2dfb836. Do not run after phase without a complete passing before phase. Preserve failures and cleanup. PR8 body mirrors checkpoint off-device.
