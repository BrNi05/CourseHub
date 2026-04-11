# CourseHub Agent Guide

**Meta Note:** This file is the ground-truth knowledge base for AI agents in this repo. Prefer it over general training priors. When you discover a stable repository-specific pattern or a resolved ambiguity, update this file.

## Repository Context & Constraints

- **Type:** `pnpm` monorepo with Turborepo orchestration.
- **Workspace:** root package is included in `pnpm-workspace.yaml` alongside `apps/*` and `packages/*`.
- **Node/pnpm:** use versions and constraints already pinned in the workspace. `pnpm` is pinned in the root `package.json`.
- **Architecture:** API-first: `apps/backend` -> `openapi.json` -> `packages/sdk` -> `apps/client`.
- **Primary stack:** NestJS backend, Prisma, generated SDK via `@hey-api/openapi-ts`, Vue 3 client, UnoCSS.

## Hallucination Guards

- Never hand-edit generated SDK output under `packages/sdk/src`.
- Never hand-edit Prisma generated client output under `apps/backend/src/prisma/generated`.
- Never hand-edit built frontend assets under `apps/backend/public/frontend`.
- Never hand-edit the lockfile or invent workspace packages. You can edit `package.json` scripts when needed.
- Never instantiate `PrismaClient` directly in application runtime code; use the established `PrismaService` pattern.
- Never bypass the generated SDK for internal API calls unless the task is explicitly about the API layer itself.
- Never assume a tool, package, or architectural pattern exists without checking the repo first.

## Core Rules

- Preserve existing behavior unless the task explicitly requires changing it.
- Security and performance are a hard requirement, not a nice-to-have.
- Automated tests are required for code changes. Backend tests use Vitest.
- Do not weaken validation, auth, authorization, rate limiting, logging, or input constraints to make a change easier.
- If a change affects generated artifacts or contracts, regenerate them in the same change.
- If a change affects the Terms of Service, GDPR privacy docs, or the LIA, update them in the same change.
- Prefer targeted changes that match existing naming, module boundaries, and code style.
- Write comments only when they add non-obvious context—primarily why something exists or is implemented a certain way (e.g., constraints, tradeoffs, external quirks). Avoid explaining what the code does; rely on clear code.

## Repo Shape

CourseHub is a `pnpm` monorepo:

- `apps/backend`: NestJS API, Prisma, auth, admin/ops endpoints, static asset serving.
- `apps/client`: Vue 3 SPA with TypeScript and UnoCSS.
- `apps/database-backup`: standalone Python CLI for pulling remote database backups locally.
- `packages/sdk`: generated TypeScript SDK from backend OpenAPI.
- `docs`: project documentation.
- `hosting`: deployment and infrastructure helpers.
- `eslint-rules`: custom repository lint rules.
- `legal`: GDPR, LIA and Terms documents.
- `dev-tools`: local maintenance scripts.
- `openapi.json`: generated backend OpenAPI spec at repo root.

The repo is API-first in practice:

1. Backend controllers/services define behavior and the API contract.
2. OpenAPI is generated from the backend into the root `openapi.json`.
3. The SDK is generated from OpenAPI.
4. The client consumes the generated SDK.

## Current Implementation Notes

- Backend runtime entry point: `apps/backend/src/main.ts`.
- Backend Prisma service: `apps/backend/src/prisma/prisma.service.ts`.
- Backend generated Prisma client import path is local: `./generated/client/client.js`, not `@prisma/client`.
- Client API defaults live in `apps/client/src/api/api.ts` and currently enforce `baseURL: '/api'`, `withCredentials: true`, and `throwOnError: true`.
- Client routing lives in `apps/client/src/router`.
- Client state uses the local `stores` tree; do not introduce a new state library without explicit need.
- The backend serves the SPA and static assets; the top-level `bundle:static` flow copies client output into the backend.
- Ignore the local backup helper under `apps/database-backup`. It is a dev helper tool and is not releant to the production code.

## Security Requirements

- Treat backend and database changes as security-sensitive by default.
- Keep client API requests credentialed. Existing API wrappers use `withCredentials: true`; preserve equivalent behavior.
- Keep DTO validation, whitelisting, serialization, guards, filters, throttling, and security middleware intact.
- Keep admin-only and internal-only routes protected. Do not broaden access accidentally.
- Validate and sanitize all new inputs.
- Prefer least privilege for new endpoints, jobs, and data access paths.
- Do not expose secrets, stack traces, internal IDs, or operational details in user-facing responses unless the existing API already requires it.
- If touching deployment, Docker, or hosting code, keep the image/runtime minimal and avoid adding avoidable attack surface.
- Review `SECURITY.md` before making changes that affect auth, deployment, client support policy, or vulnerability handling.
- Preserve the backend defaults in `main.ts` unless the task explicitly changes them: small request body limits, CORS credentials, Helmet/CSP/HSTS, HPP, cookie parsing, global serialization, and strict validation (`whitelist`, `forbidNonWhitelisted`, `transform`).

## Testing Policy

- Every code change should include or update automated tests.
- Backend controller and service files must have matching `*.spec.ts` files. This is enforced by the repo lint rules.
- Prefer targeted unit tests first, then broader integration coverage where behavior crosses boundaries.
- A bug fix should usually come with a regression test that fails before the fix and passes after it.
- Do not remove or weaken tests to get a change through.
- If working in an area without test coverage yet, add a smaller, maintainable test coverage that proves the change and its security and stability.
- The client currently has no formal test harness in workspace scripts; do not invent one unless the task requires it.

## Backend Rules

- Keep controllers thin and business logic in services.
- Follow existing NestJS patterns: DTOs, decorators, guards, interceptors, filters, and serializer-based responses.
- Prefer Nest auth parameter decorators such as `@AuthUserId()` and `@AuthUser()` over controller-level `@Req()` usage for authenticated user access.
- Prefer authorization guards/decorator composition at the controller boundary over passing transport-layer auth objects through service APIs.
- All new non-trivial endpoint inputs should go through DTOs with validation decorators.
- Do not import Prisma directly in `*.service.ts` files; repo lint rules explicitly ban this. Follow the established `PrismaService` pattern.
- Maintain throttling on endpoints. New mutation or admin endpoints should be reviewed for throttling needs.
- When changing API shapes, also update generated OpenAPI and SDK outputs by running the proper `pnpm` command.
- Use Nest HTTP exceptions for application-level API failures so responses stay consistent.
- When changing Prisma schema:
  - add a migration
  - regenerate Prisma client
  - update tests affected by schema changes
- Be aware that OpenAPI generation intentionally avoids opening a database connection via `OPENAPI_GENERATION=true`; do not break that path.
- Preserve cache invalidation and event-driven behavior when changing course, faculty, university, or user flows.

## Frontend Rules

- Preserve the current SPA routing and state flow unless the task explicitly changes it.
- Prefer existing API wrappers, store modules, and shared utilities over ad hoc fetch or axios usage.
- Prefer the generated SDK plus `apiOptions()` over raw HTTP calls when consuming backend endpoints.
- Keep auth/session behavior aligned with the backend’s cookie-based model.
- Avoid introducing security regressions through unsafe HTML rendering, looser URL handling, or storing sensitive server data in browser storage.
- Keep changes consistent with the current Vue 3 + TypeScript structure.
- If changing behavior that depends on backend responses, confirm the SDK and API contract still match.

## Generated And Derived Files

When backend contract changes affect generated outputs, keep them in sync:

- Prisma client: `pnpm --filter @coursehub/backend db:generate`
- OpenAPI: `pnpm --filter ./apps/backend api:gen`
- SDK: `pnpm --filter ./packages/sdk gen:sdk`
- Full refresh path: `pnpm refresh:sdk`
- Static frontend bundle for backend serving: `pnpm bundle:static`

## Build Graph Notes

- `turbo.json` makes backend tests depend on backend build.
- `@coursehub/backend#api:gen` depends on backend tests.
- `@coursehub/sdk#gen:sdk` depends on backend OpenAPI generation.
- `@coursehub/sdk#build` depends on SDK generation.
- Client build depends on SDK build.
- Root `lint:all` depends on SDK build, so if types drift, regenerate/build the SDK before assuming lint is broken for unrelated reasons.

## Useful Commands

- Install deps: `pnpm install`
- Lint: `pnpm lint:all`
- All tests: `pnpm test`
- Full build: `pnpm build:all`
- Backend tests: `pnpm --filter @coursehub/backend test`
- Backend test watch: `pnpm --filter @coursehub/backend test:watch`
- Backend build: `pnpm --filter @coursehub/backend build`
- Client build: `pnpm --filter @coursehub/client build`
- Regenerate Prisma client: `pnpm --filter @coursehub/backend db:generate`
- Regenerate OpenAPI only: `pnpm --filter ./apps/backend api:gen`
- Regenerate SDK only: `pnpm --filter ./packages/sdk gen:sdk`
- Refresh SDK after API changes: `pnpm refresh:sdk`
- Rebundle frontend into backend static assets: `pnpm bundle:static`

## Change Checklist

Before finishing work, verify:

- Behavior matches the task and does not accidentally regress current flows.
- Security posture is unchanged or improved.
- Automated tests were added or updated.
- Lint passes for touched areas.
- Generated artifacts were refreshed if the API/schema changed.
- Docs were updated when the developer workflow or architecture changed materially.

## Preferred Agent Behavior

- Read existing code before changing patterns.
- Match local naming, file placement, and architectural conventions.
- Call out uncertainty instead of guessing when a change could affect security or data integrity.
- If code contradicts this file, treat the code as possible legacy behavior: verify first, then either follow the documented standard or update this file deliberately.
- Favor explicitness over hidden or implicit behavior.
- If you update a stable repo convention or resolve a recurring ambiguity, update this file in the same change.
