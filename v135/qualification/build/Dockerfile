FROM python@sha256:e8c69d86735f6df3efa06b324694fe51f0422785f83a3bd463052636c2421944 AS build
ARG A10_QUALIFICATION_SOURCE_COMMIT_SHA
ARG RAILWAY_GIT_COMMIT_SHA
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /work
COPY . /repo
RUN ["/usr/bin/timeout", "--signal=TERM", "--kill-after=5s", "900s", "/usr/local/bin/python3", "-B", "/repo/v135/qualification/build/build_stage_a.py"]

FROM scratch
COPY --from=build --chown=0:0 /output/ /
ENV PATH=/usr/local/bin:/usr/bin:/bin LANG=C.UTF-8 TZ=UTC NODE_ENV=production PYTHONDONTWRITEBYTECODE=1
WORKDIR /control/qualification
EXPOSE 8080
USER 0:0
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/python3", "-I", "-B", "/control/qualification/qualification_entry.py"]
