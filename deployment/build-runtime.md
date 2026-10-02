# Reproducible build toolchain

The bounded test on 21 September 2026 exposed real provider drift on the same
source commit `91fc78eb6ef37ef1e5fdad82e465004baade65e0`: the first deployment used
Nixpacks and Node 24, while redeployment used Railpack and Node 20.20.2. Hosted CI
had tested Node 22.23.2 and npm 10.9.8. The provider's dashboard configuration did
not reliably describe the effective build plan. Those historical results remain
valid only for their recorded environments; they are not identical-binary proof.

`.node-version` now pins the exact tested Node release. All three hosted workflows
read it, and the root, backend and Pillow manifests agree on Node and npm versions.
Their preinstall hook rejects other Node versions and, when invoked by npm, other
npm versions. `packageManager` selects npm 10.9.8. A direct invocation of the guard
without npm's user-agent proves only Node and explicitly reports npm as unverified.
This is an install/build check. Production still starts with its existing direct
Node command, so the hook is not a production startup assertion. Actual running
versions require a separate runtime probe.

`railpack.json` pins Node and replaces its automatic root install with
`npm ci --include=dev`. `nixpacks.toml` selects Node major 22 and an explicit root
`npm ci`. Application installs in root `railway.toml` also use `npm ci`. Dependency
versions, production startup, restart policy, readiness path and authority are
otherwise unchanged. The build-contract check also permits a temporary root that
is byte-for-byte the reviewed canary reference; it does not authorize deployment.

Railpack's Node provider disables its manifest-only install file filtering when
the root package has a `preinstall` or `postinstall` hook. The root hook added here
therefore retains `.node-version` and `scripts/verify-build-runtime.mjs` in the
install input. No explicit layer-input override is needed.
The Node provider's documented `packageManager` support selects the exact npm
version via Corepack; no separate Mise npm package override is assumed.

This repair covers the Railway backend/Pillow toolchain and hosted CI. It does not
pin the separate `empireai-web` Vercel project runtime or establish Vercel runtime
parity; that requires its own project configuration and deployment evidence.

Nixpacks documents only major-version selection. Its package archive can therefore
resolve a different Node 22 patch. The preinstall guard deliberately rejects that
build rather than silently changing the tested runtime. If this happens, select a
provider build path that can supply the pinned version and verify its actual plan;
do not remove the guard or broaden the version range to obtain a green result.

Local contract tests establish configuration consistency and rejection of the
observed Node 20/24 drift. They do not establish a new hosted build, production
promotion, persistent recovery, Pillow Birth or commerce readiness. The next
authorized deployment must record actual `node --version`, `npm --version`, source
commit and artifact identity before and after restart. Changing a pin requires
new CI proof; rebuilding source is not equivalent to restarting the same image.

Provider documentation checked on 21 September 2026:

- [Railpack Node selection and package managers](https://railpack.com/languages/node/)
- [Railpack configuration file](https://railpack.com/config/file/)
- [Nixpacks Node provider and major-version limitation](https://nixpacks.com/docs/providers/node)
