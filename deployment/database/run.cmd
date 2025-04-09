@echo off
set COMPOSE_PROJECT_NAME=avarc

:: Get the directory where this script is located and navigate to project root
set "SCRIPT_DIR=%~dp0"
set "LOCAL_INIT_SCRIPTS=%SCRIPT_DIR%..\..\avarc-db\init-scripts"

:: Set the path for Docker Compose
set "COMPOSE_CONVERT_WINDOWS_PATHS=1"
set "INIT_SCRIPTS_PATH=%LOCAL_INIT_SCRIPTS%"

docker compose up -d
