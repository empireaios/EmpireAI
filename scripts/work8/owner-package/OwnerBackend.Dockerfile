ARG NODE_IMAGE
FROM ${NODE_IMAGE} AS package
WORKDIR /app
COPY . .
RUN find backend/dist pillow/dist -type f -print0 | sort -z | xargs -0 sha256sum > /compiled.sha256
# Existing dependency lifecycle hooks check tooling; no build lifecycle invoked.
RUN test "$(node --version)" = v22.23.2 && test "$(npm --version)" = 10.9.8
RUN npm ci --prefix pillow && npm ci --prefix backend
RUN node scripts/sync-pillow-governance.mjs
RUN npm prune --omit=dev --ignore-scripts --prefix pillow && npm prune --omit=dev --ignore-scripts --prefix backend
RUN sha256sum -c /compiled.sha256
RUN test -s backend/dist/index.js && test -s backend/dist/runtime/native-store-capture-lock.cjs && test -s pillow/dist/index.js && test -d backend/.pillow-governance-bundle
FROM ${NODE_IMAGE}
# Retain the complete exact-source runtime graph and dependency trees; this is
# an examination package, not an approved seven-participant release lineage.
COPY --from=package /app /app
WORKDIR /app
ENV NODE_ENV=production
LABEL work8.scope="PINNED_OWNER_SOURCE_EXAMINATION_ONLY_NOT_RELEASE_ELIGIBLE"
# Preserve this source revision's locked commissioning entrypoint.
# Do not substitute the later seven-participant controller without review.
CMD ["node", "deployment/locked-runtime.cjs"]
