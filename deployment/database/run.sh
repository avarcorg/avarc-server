#!/bin/bash

# Set the project name
export COMPOSE_PROJECT_NAME=avarc

# Get the directory where this script is located and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SCRIPTS_PATH="$SCRIPT_DIR/../../avarc-dbinit-scripts"

# Set the path for Docker Compose
export INIT_SCRIPTS_PATH

# Start Docker Compose
docker compose up -d
