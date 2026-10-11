# TASK: Set up CodeQL

Spec: [SPEC-code-scanning.md](../spec/SPEC-code-scanning.md)

Depends on: backend-skeleton, frontend-skeleton

- Decide between GitHub default setup and an advanced workflow file.
- Add the workflow with the languages and triggers from the spec, restricted
  to `main` and pull requests targeting `main`.
- Make sure the branches listed in the spec are ignored, and verify no
  analysis runs for them.
- Decide whether findings block merging, and record it in the spec.
- Update `spec/SPEC-code-scanning.md` with the decisions.
