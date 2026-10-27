# Owner backend packaging candidate

Local preparation only; no packaging, installation, CI or publication executed.

Inputs: clean checkout at `98970018d579e5a7c720d25293cdddbe294856c0`, accepted extracted artifact `12698388923` from run `40424964819` attempt 1, and a new output directory. The script pins the compiled archive, source tree and two dependency lock hashes. Obtain and independently approve a Linux amd64 `node:22.23.2-bookworm-slim@sha256:...` base identity before execution; an unpinned image is refused.

Authorized hosted invocation:

```bash
OWNER_NODE_IMAGE='node:22.23.2-bookworm-slim@sha256:<reviewed-digest>' bash package-owner-backend.sh /exact/backend-source /accepted/owner-build /new/owner-package-output
```

Requires Docker Linux amd64 and network access to the approved base-image and npm registries. Run only after exact-tree publication/execution approval. The staged dedicated workflow runs only on push to `work8/owner-packaging-20261027`, attempt 1, with a 20-minute timeout. Do not publish or dispatch this draft without exact-tree approval. It does not trigger the writer-integration O33 workflow. Retain packaging log/exit code even on failure.

The image retains backend dependencies, exact compiled backend and sibling Pillow output, and the manifest-driven governance bundle. The existing lifecycle hooks execute environment verification; no compilation command is invoked. Compiled file checksums must remain unchanged during dependency installation and governance assembly. Output is a Docker-loadable image archive and image ID with provenance hashes, not a platform deployment or registry publication.

Hosted validation remains pending: dependency installation and governance assembly success, image export, runtime/layout compatibility, and independent image examination. No runtime process starts during this recipe. The exact pinned locked-runtime entrypoint is retained, but its compatibility with the subsequently accepted O33 topology remains a separate review.

Separate release gates remain: frontend environment binding and supported packaging; selectable compatible rollback artifact; exact-pair authenticated DEFER persistence/replay/history; protected consistent operational copy/readback; release-time drift binding; production approval and connected-owner acceptance. After any durable DEFER, retain corrected backend or verified compatible successor; never rewind institutional data.

## Source/controller compatibility gate

The retained corrected Owner backend `98970018...` predates the accepted seven-participant O33 controller. Do not replace its entrypoint with `node dist/index.js` for release or graft the later controller onto it without an exact reviewed compatible lineage. The package preserves `node deployment/locked-runtime.cjs` from repository-root working directory, retains the full exact-source graph and both dependency trees, and is examination-only until runtime acceptance. No application is launched by the packaging script. Source/controller compatibility is an essential prerequisite for a release-eligible runtime image.

Retained O33 evidence provides a reusable reviewed base candidate: `node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9`. Its provenance remains the accepted O33 image evidence; do not repull solely to recheck it.
