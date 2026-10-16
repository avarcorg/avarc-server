---
id: AVARC-49
type: task
status: open
priority: normal
area: frontend
depends-on: [AVARC-30, AVARC-31]
created: 2026-10-16
---

# TASK: Browser tests in a container

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md) (a section on the tests is
written first)

The pages are only checked by building them and by fetching their HTML. What a
browser does with them is not tested: the Leaflet map is drawn in the browser
only ([AVARC-12](TASK-locations-ui.md)), the login is a chain of redirects
through Keycloak, and layout problems on a phone do not show in HTML. This
task adds browser tests that run in a container, so no browser is needed on a
developer machine or on the build host (nothing but Docker is, as for Node).

## Approach

- **A test image with headless Chromium** and a test runner (Playwright). The
  image is built from the repository and independent of the images that get
  deployed, so a test build never touches them. Pin exact versions of the
  runner and the base image. Decide in the spec whether the tests are
  TypeScript (the language of the frontend, run like the other Node commands
  through a container) or Python with pytest; record why.
- **One script runs everything:** it builds or pulls the images of the
  project, starts a throwaway Compose project on its own network (database,
  Keycloak, backend, frontend, ingress) with generated test secrets, creates
  test accounts with the existing user scripts (a viewer, an editor, an
  admin), runs the tests in the test container against the ingress, writes
  screenshots, and always removes containers, network and the generated
  secrets afterwards. Extra arguments go to the test runner. It needs only
  Docker, and fails clearly when the images it should test are missing.
- **Test data through the API:** the tests create their locations with the
  API as an editor and delete them afterwards, so they do not depend on what
  an environment already holds.
- **No third parties and no network from the tests:** requests to the map tile
  server are answered by the test itself with a blank tile, and the test
  fails on any other request that leaves the project (a font, a script, an
  image from elsewhere).
- **Rule-based, no reference images:** the checks assert on the rendered
  page (a marker per location, the popup and its link, the detail page,
  language switch, no horizontal scroll, text contrast, keyboard operation of
  the navigation), so an intended restyle needs no baselines regenerated.
  Screenshots are saved for manual review only.

## What to test first

- Login through Keycloak and logout, a visitor without a session sent to the
  login page.
- The locations page: the map is shown, a marker per location, a marker's
  popup links to the location, the list matches the map, both languages, a
  text without a translation in the page language is marked.
- The detail page: texts, period with BCE and CE years, references open in a
  new tab, the small map.
- A phone, a tablet and a desktop viewport: the navigation menu, nothing
  scrolls horizontally.
- Once the forms exist (step 2 of [AVARC-12](TASK-locations-ui.md)): create,
  edit and delete as an editor, the controls hidden for a viewer, tag labels
  only for an admin.

## Remaining

- Write the section on the tests in `SPEC-frontend.md`, including the choice
  of language and runner.
- Build the image, the script and the first tests; keep ShellCheck clean.
- Save screenshots (one per viewport and page) into a gitignored directory,
  with an overview page, and keep the traces of a failed run there.
- Run the script in the CI build before the images are published, so a
  failing test stops the publish; decide whether it is slow enough to need
  its own job or a trigger of its own, and what is archived from a failed run.
- Describe the script in `AGENTS.md`.

## Verification

The script runs on a machine with only Docker, ends with all tests passing,
and leaves no container, network or secret behind. A deliberately broken page
(a marker not drawn, a horizontal overflow on the phone, a request to another
host) fails it, with a screenshot of the failure.
