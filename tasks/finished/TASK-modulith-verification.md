---
id: AVARC-35
type: task
status: finished
priority: normal
area: backend
depends-on: [AVARC-3]
created: 2026-10-15
---

# TASK: Verify the module boundaries with Spring Modulith

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md)

The spec says the backend is a Spring Modulith monolith whose module
boundaries Modulith verifies, but Modulith is not a dependency yet and
nothing fails the build when a boundary is broken. A trial run
(2026-10-15) found one module, `auth`, and no violations; the application
class, `HelloController` and `ApiDocsConfig` sit in the root package, outside
any module.

- Add Spring Modulith (the BOM, version one property that Renovate can
  update, and the test starter) to the backend.
- Add a test that verifies the module structure with
  `ApplicationModules.verify()`, so the build fails on a cycle or on a
  module that uses another module's internals. Write the module
  documentation (the `Documenter` output) to the build directory if the
  starter offers it without further dependencies.
- Settle the layout rule and record it in the spec: an application module is
  a direct sub-package of `org.avarc.server`; the types in its top-level
  package are its API, sub-packages are internal; modules depend on each
  other only through that API and without cycles. The root package holds the
  application class only.
- Move `ApiDocsConfig` and `HelloController` into modules of their own, so
  that nothing but the application class is in the root package.
- Show that the test works: a deliberate violation (a temporary class that
  reaches into the internals of another module) fails it.
- Say in `AGENTS.md` where the rule is and that the test is part of
  `./mvnw verify`.
- The locations module of [AVARC-10](../TASK-locations-crud-api.md) is the
  first module to which the rule really applies; mention the rule there.

## Result

Spring Modulith 2.1.1 (property `spring-modulith.version` of the backend
POM, test starter only). `ModularityTests` verifies the modules and writes
the PlantUML diagrams to `target/spring-modulith-docs/`. `ApiDocsConfig` is
now the module `apidocs` and `HelloController` the module `hello`; the root
package holds the application class only. A deliberate violation (a class of
`hello` using `auth.internal.Secret`) made the test fail with "Module 'hello'
depends on non-exposed type ...", and was removed again.
