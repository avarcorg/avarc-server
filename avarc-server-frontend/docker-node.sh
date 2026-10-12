#!/bin/sh
# Runs a command in the Node container, in this directory, as the calling
# user, so that nothing needs Node installed on the host:
#
#   NODE_IMAGE=<image> [NODE_PORT=<port>] ./docker-node.sh npm ci
#
# The Maven build sets NODE_IMAGE from the node.image property (see pom.xml).
# NODE_PORT publishes the dev server on that host port.
set -e
: "${NODE_IMAGE:?docker-node.sh: set NODE_IMAGE (the Maven build does)}"
cd "$(dirname "$0")"
TTY=; [ -t 0 ] && TTY=-it
exec docker run --rm --init ${TTY} -u "$(id -u):$(id -g)" \
    ${NODE_PORT:+-p "${NODE_PORT}:3000"} \
    -e HOME=/tmp -e NEXT_TELEMETRY_DISABLED=1 \
    -v "$PWD:/app" -w /app "${NODE_IMAGE}" "$@"
