FROM python@sha256:e8c69d86735f6df3efa06b324694fe51f0422785f83a3bd463052636c2421944 AS build
ARG A09_SOURCE_COMMIT_SHA
ARG RAILWAY_GIT_COMMIT_SHA
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /work
COPY . /repo
RUN ["/usr/bin/timeout", "--signal=TERM", "--kill-after=5s", "900s", "/usr/local/bin/python3", "-B", "/repo/v128/owner_review/portable/build_image.py"]

FROM scratch
COPY --from=build --chown=0:0 /output/ /
ENV PATH=/usr/local/bin:/usr/bin:/bin LANG=C.UTF-8 TZ=UTC NODE_ENV=production PYTHONDONTWRITEBYTECODE=1
WORKDIR /control
USER 0:0
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/timeout", "--signal=TERM", "--kill-after=1s", "5s", "/usr/bin/python3", "-I", "-B", "-c", "print('PUBLIC_QUALIFICATION_TERMINAL', flush=True)"]
