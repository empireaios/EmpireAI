FROM node:22.23.2-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 libseccomp2 redis-server \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Source is a read-only bind mount. No provider credentials or Docker socket.
RUN command -v python3 && command -v redis-server && python3 -c 'import sqlite3, ctypes; ctypes.CDLL("libseccomp.so.2")'
