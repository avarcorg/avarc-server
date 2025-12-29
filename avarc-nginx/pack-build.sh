#!/bin/sh -e

# Enable Docker BuildKit for better performance and compatibility
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Diagnostic information (only in non-CI environments)
if [ -z "$CI" ] && [ -z "$GITHUB_ACTIONS" ]; then
    echo "=== Docker Diagnostics ==="
    echo "Docker version:"
    docker --version || true
    echo "Docker info (context):"
    docker info 2>&1 | grep -E "(Context|Rootless|Storage Driver)" || true
    echo "Docker socket permissions:"
    ls -l /var/run/docker.sock 2>/dev/null || echo "Docker socket not found at /var/run/docker.sock"
    echo "SELinux status:"
    getenforce 2>/dev/null || echo "SELinux not available"
    echo "Pack version:"
    pack --version || true
    echo "Testing detector with unconfined seccomp:"
    docker run --rm --security-opt seccomp=unconfined paketobuildpacks/builder-jammy-base:latest ls -la /cnb/lifecycle/detector 2>&1 | head -1 || echo "Test failed"
    echo "=========================="
fi

set -x

# Build with verbose output for debugging
# 
# Troubleshooting "operation not permitted" errors:
# This error occurs when Docker's seccomp profile blocks execution of /cnb/lifecycle/detector.
# The detector likely needs syscalls (e.g., unshare) that are restricted by seccomp.
#
# Known Solutions:
# 1. Update libseccomp: sudo apt-get update && sudo apt-get install libseccomp2
# 2. Configure Docker daemon to use unconfined seccomp (NOT RECOMMENDED for production):
#    Create /etc/docker/daemon.json with: { "seccomp-profile": "unconfined" }
#    Then: sudo systemctl restart docker
# 3. This works on GitHub Actions without modifications (proper permissions there)
# 4. As a workaround, use the Dockerfile approach locally (docker buildx build)
#
# Note: Pack doesn't expose Docker security options directly, so daemon-level config
# may be needed if the issue persists. Pack version 0.39.0 is current.
pack \
    build \
    avarc-nginx:0.1.0-SNAPSHOT \
    --path \
    $(pwd) \
    --builder \
    paketobuildpacks/builder-jammy-base \
    --buildpack \
    docker.io/paketobuildpacks/nginx \
    --trust-builder \
    --verbose \
    --env \
    BP_NGINX_CONF_PATH=nginx.conf \
    --env \
    BP_NGINX_STATIC_ROOT=.
