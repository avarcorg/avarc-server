#!/bin/sh -e
# Install the deployment of an environment on its host: the files of this
# directory go to /home/avarc-<environment>, the systemd unit to
# /etc/systemd/system. Run as root, from a checkout, to update; it does not
# start or restart the service and never touches data or secrets.
#
#   deploy/deploy.sh stage|prod

if [ "$(id -u)" -ne 0 ]
then
    echo "deploy.sh must be run as root" >&2
    exit 1
fi

ENVIRONMENT=$1
case "${ENVIRONMENT}" in
    stage|prod) ;;
    *) echo "usage: deploy.sh stage|prod" >&2; exit 1 ;;
esac

NAME=avarc-${ENVIRONMENT}
P=$(dirname "$(realpath "$0")")
D=/home/${NAME}

if ! id ${NAME} > /dev/null 2>&1
then
    echo "deploy.sh: user ${NAME} does not exist" >&2
    exit 1
fi

# Writes a new file next to the target and renames it over it, so a shell
# that is running the old file (run.sh, started by systemd) keeps reading the
# old one; overwriting it in place would break that shell in the middle of
# the script. The owner of the old file is kept.
copy () {
    if [ "$(realpath $1)" != "$(realpath -m $2)" ]
    then
        cp $1 $2.new
        [ ! -e $2 ] || chown --reference=$2 $2.new
        chmod $3 $2.new
        mv -f $2.new $2
    fi
    chmod $3 $2
}

# The release this checkout is: a tag, or the commit after one. Prod runs
# releases only. The checkout belongs to another user, hence safe.directory.
version () {
    git -C ${P} -c safe.directory='*' "$@" 2> /dev/null
}
VERSION=$(version describe --tags --always --dirty) || VERSION=unknown
if [ "${ENVIRONMENT}" = "prod" ]
then
    version describe --tags --exact-match --match 'v[0-9]*' HEAD > /dev/null \
        || { echo "deploy.sh: prod runs a release; check out its tag (${VERSION} is not one)" >&2; exit 1; }
    [ -z "$(version status --porcelain --untracked-files=no)" ] \
        || { echo "deploy.sh: the checkout has uncommitted changes" >&2; exit 1; }
fi

copy ${P}/systemd/${NAME}.service /etc/systemd/system/${NAME}.service 0644
copy ${P}/run.sh ${D}/run.sh 0755
copy ${P}/keycloak-lib.sh ${D}/keycloak-lib.sh 0644
copy ${P}/create-admin-user.sh ${D}/create-admin-user.sh 0755
copy ${P}/create-user.sh ${D}/create-user.sh 0755
copy ${P}/docker-compose.template ${D}/docker-compose.template 0644

echo "${VERSION}" > ${D}/VERSION
chmod 0644 ${D}/VERSION

systemctl daemon-reload
echo "installed ${VERSION} for ${ENVIRONMENT}; restart ${NAME} to run it"

#
# Fini...
#
