#!/bin/sh
# Runs a command in the Node container, in this directory, as the calling
# user, so that nothing needs Node installed on the host:
#
#   NODE_IMAGE=<image> [NODE_PORT=<port>] [NPM_CACHE=<dir>] ./docker-node.sh npm ci
#
# The Maven build sets NODE_IMAGE from the node.image property (see pom.xml).
# NODE_PORT publishes the dev server on that host port. NPM_CACHE is a host
# directory that keeps npm's download cache between runs (the container is
# thrown away each time); a CI cache stores it.
set -e
: "${NODE_IMAGE:?docker-node.sh: set NODE_IMAGE (the Maven build does)}"
cd "$(dirname "$0")"
TTY=; [ -t 0 ] && TTY=-it
[ -z "${NPM_CACHE:-}" ] || mkdir -p "${NPM_CACHE}"
exec docker run --rm --init ${TTY} -u "$(id -u):$(id -g)" \
    ${NODE_PORT:+-p "${NODE_PORT}:3000"} \
    ${NPM_CACHE:+-v "${NPM_CACHE}:/tmp/.npm"} \
    -e HOME=/tmp -e NEXT_TELEMETRY_DISABLED=1 \
    -v "$PWD:/app" -w /app "${NODE_IMAGE}" "$@"
