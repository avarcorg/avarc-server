# Sourced by the scripts of this directory that work on an environment.
#
# default_environment prints the environment of the user that runs the script:
# avarc-stage is stage, avarc-prod and avarc are prod, anyone else is dev. The
# scripts use it only when neither an option (--dev, --stage, --prod) nor
# SECRETS names the environment. See spec/SPEC-deployment.md.
default_environment () {
    case "$(id -un)" in
        avarc-stage) echo stage ;;
        avarc-prod|avarc) echo prod ;;
        *) echo dev ;;
    esac
}
