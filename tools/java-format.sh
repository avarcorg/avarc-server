#!/bin/sh
# Formats the Java sources of the backend with Open Java Format, or checks
# them without changing a file. See spec/SPEC-backend.md.
#
#   tools/java-format.sh [format|check]       (default: format)
set -eu
root=$(git rev-parse --show-toplevel)
case "${1:-format}" in
    format) goal=format ;;
    check) goal=check ;;
    -h|--help) sed -n '2,/^set -eu$/p' "$0" | sed -e '/^set -eu$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "java-format.sh: unknown argument '$1'" >&2; exit 1 ;;
esac
cd "${root}"
exec ./mvnw -B -q -pl avarc-server-backend "dev.openjavaformat:fmt-maven-plugin:${goal}"
