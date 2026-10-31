FROM node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9 AS compiler
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY native/runtime-writer-isolation.c /build/isolation.c
RUN cc -shared -fPIC -O2 -std=c11 -Wall -Wextra -Werror -Wl,-z,relro,-z,now isolation.c -o /build/runtime-writer-isolation.so
FROM node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9
RUN apt-get update && apt-get install -y --no-install-recommends util-linux && rm -rf /var/lib/apt/lists/*
WORKDIR /probe
COPY --from=compiler /build/runtime-writer-isolation.so /probe/runtime-writer-isolation.so
COPY bootstrap.cjs probe.cjs child.cjs runtime-writer-isolation.cjs /probe/
RUN chmod -R go-w /probe && chmod 0444 /probe/runtime-writer-isolation.so && sha256sum /probe/runtime-writer-isolation.so | cut -d ' ' -f 1 > /probe/native.sha256 && chmod 0444 /probe/native.sha256 && mkdir /probe-policy && printf '%s\n' '{"mode":"RESTRICTED"}' > /probe-policy/control.json && chmod 0555 /probe-policy && chmod 0444 /probe-policy/control.json && setpriv --version > /probe/setpriv-version.txt && sha256sum /usr/bin/setpriv | cut -d ' ' -f 1 > /probe/setpriv.sha256 && command -v timeout
USER 0:0
ENTRYPOINT ["timeout","--signal=KILL","30s","node","/probe/bootstrap.cjs"]
