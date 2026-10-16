---
id: AVARC-47
type: task
status: in-progress
priority: normal
area: frontend
depends-on: [AVARC-46]
created: 2026-10-15
---

# TASK: External translation service

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md)

The translations are maintained in an external translation service. The
translation keys of the repository and the translations of the service are
synchronized in both directions: new and removed keys reach the service,
finished translations reach the repository.

## Decisions

Crowdin is the service (its project and token already exist as repository
secrets). Source `en`, targets the other languages; the upload on a push to
`main`, the download weekly and on demand as a pull request, translations
never pushed to `main` directly; a target may lack keys (English shows
instead), `--complete` is enforced for releases. Details:
[SPEC-frontend.md](../spec/SPEC-frontend.md), "Translation service".

## Progress

Checked through the Crowdin API on 2026-10-16: the existing project (id in
the repository secret `CROWDIN_PROJECT_ID`) is reused. Its old content (the
earlier application's six `i18next` files, 117 strings, German and Turkish
translations) was downloaded to the gitignored `local/crowdin-old/` and then
removed from the project. The project now holds `/en.json` (the current
`messages/en.json`, type `json`, 101 strings) with the 101 German texts of
`messages/de.json` imported (all 101 translated); a build of the German
translation is identical to `messages/de.json`. The secrets
`CROWDIN_PROJECT_ID` and `CROWDIN_PERSONAL_TOKEN` exist in the repository.

Found on the way: the project cannot change its settings through the API,
because the plan rejects its stored `languageAccessPolicy` ("moderate") and a
private project cannot use "open". So the target language `tr` is still in
the project (unused: the workflows ask for `de` only, via `download_language`
in `crowdin.yml`), and "skip untranslated strings" is passed per download
instead of set in the project. Removing `tr` and the policy needs the project
settings page, or the Open Source License.

Keys are not extracted from the code: `tools/check-messages.py` scans `src/`
and fails on a used key that `en.json` lacks and on an unused key, with an
allow-list for keys built at run time.

The first download run failed: the CLI could not match the translated file
the service built (named `en.json`, like the source) to `crowdin.yml`. The
file's export pattern in the project is now
`/avarc-server-frontend/messages/%two_letters_code%.json` (set through the
API, as the file was created by hand); without it the download cannot place
the file. The download job also no longer uploads the sources, which the
action does by default.

## Remaining

- Checked on GitHub: the upload, the download without changes (no pull
  request), and a text translated in Crowdin (a pull request on
  `l10n/crowdin` that changed only `de.json`). The pull request needs the
  repository setting "Allow GitHub Actions to create and approve pull
  requests", which is on.
- The first release tag runs `--complete`; check that it passes.

## Acceptance

- Adding a key to `en.json` on `main` makes it appear in Crowdin, removing it
  removes it there.
- A text translated in Crowdin arrives as a pull request on `l10n/crowdin`
  that changes only the target files and passes `tools/check-messages.py`.
- A page in a language with a missing key shows the English text; a release
  tag with a missing key fails.
- No token appears in the repository or in a workflow log.
