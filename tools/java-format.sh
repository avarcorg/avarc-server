#!/bin/sh
# Formats the tracked and new Java sources of the backend with the Open Java
# Format binary, or checks them without changing a file. See
# spec/SPEC-backend.md.
#
#   tools/java-format.sh [format|check]       (default: format)
#   tools/java-format.sh file FILE...         (format the given Java files only)
#
# "file" is for an editor or agent hook after every edit: other files are
# skipped, and unused imports are kept, as an import may be added before the
# code that uses it; "format" and "check" remove them.
#
# The version is the property open-java-format.version of the backend POM.
# The precompiled binary of that release is downloaded from GitHub once, its
# checksum verified, and kept in ${XDG_CACHE_HOME:-~/.cache}/open-java-format/<version>/.
# Needs curl and sha256sum on Linux or macOS.
set -eu
PROG=java-format.sh

case "${1:-format}" in
    format) mode=format ;;
    check) mode=check ;;
    file) mode="file" ;;
    -h|--help) sed -n '2,/^set -eu$/p' "$0" | sed -e '/^set -eu$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "${PROG}: unknown argument '$1'" >&2; exit 1 ;;
esac

root=$(git rev-parse --show-toplevel)
version=$(sed -n 's#.*<open-java-format.version>\(.*\)</open-java-format.version>.*#\1#p' \
    "${root}/avarc-server-backend/pom.xml")
if [ -z "${version}" ]
then
    echo "${PROG}: open-java-format.version not found in avarc-server-backend/pom.xml" >&2
    exit 1
fi

case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) asset=linux-glibc_x86-64 ;;
    Linux-aarch64|Linux-arm64) asset=linux-glibc_aarch64 ;;
    Darwin-x86_64) asset=macos_x86-64 ;;
    Darwin-arm64) asset=macos_aarch64 ;;
    *) echo "${PROG}: no precompiled binary for $(uname -s) $(uname -m)" >&2; exit 1 ;;
esac

dir=${XDG_CACHE_HOME:-${HOME}/.cache}/open-java-format/${version}
bin=${dir}/open-java-format-${asset}
if [ ! -x "${bin}" ]
then
    base=https://github.com/openjavaformat/open-java-format/releases/download/${version}
    mkdir -p "${dir}"
    tmp=$(mktemp -d "${dir}/download.XXXXXX")
    trap 'rm -rf "${tmp}"' EXIT
    echo "${PROG}: downloading open-java-format ${version} (${asset})" >&2
    curl -fsSL -o "${tmp}/open-java-format-${asset}" "${base}/open-java-format-${asset}"
    curl -fsSL -o "${tmp}/checksums_sha256.txt" "${base}/checksums_sha256.txt"
    (cd "${tmp}" && grep " open-java-format-${asset}\$" checksums_sha256.txt | sha256sum -c - > /dev/null) || {
        echo "${PROG}: checksum mismatch for the downloaded binary" >&2
        exit 1
    }
    chmod +x "${tmp}/open-java-format-${asset}"
    mv "${tmp}/open-java-format-${asset}" "${bin}"
    rm -rf "${tmp}"
    trap - EXIT
fi

if [ "${mode}" = file ]
then
    shift
    for f in "$@"
    do
        case "${f}" in
            *.java) [ -f "${f}" ] && "${bin}" --skip-removing-unused-imports --replace "${f}" ;;
        esac
    done
    exit 0
fi

cd "${root}"
# tracked files plus new ones that are not ignored
files=$(git ls-files --cached --others --exclude-standard -- 'avarc-server-backend/src/*.java')
[ -n "${files}" ] || exit 0
case "${mode}" in
    format) printf '%s\n' "${files}" | xargs "${bin}" --replace ;;
    check) printf '%s\n' "${files}" | xargs "${bin}" --dry-run --set-exit-if-changed ;;
esac
