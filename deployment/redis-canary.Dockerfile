FROM node:22.23.2-bookworm-slim AS supervisor
FROM redis:7.2.16-bookworm
USER root
COPY --from=supervisor /usr/local/bin/node /usr/local/bin/node
# Redis's C runtime alone need not contain Node's C++/atomic libraries.
# Build executes both binaries, so missing runtime libraries fail before deployment.
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && test "$(node -p process.versions.node)" = "22.23.2" \
    && redis-server --version | grep -F 'v=7.2.16'
COPY deployment/canary-launcher.cjs deployment/redis-canary-launcher.cjs /opt/empireai/deployment/
WORKDIR /data
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/node", "/opt/empireai/deployment/redis-canary-launcher.cjs"]
CMD []
