FROM node:22.23.2-bookworm-slim
RUN apt-get update && apt-get install --yes --no-install-recommends redis-server && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --chown=1000:1000 . /app
USER 1000:1000
ENTRYPOINT ["node", "scripts/work8/hh3-compiled-coordinator.mjs"]
