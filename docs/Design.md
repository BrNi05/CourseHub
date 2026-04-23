# CourseHub Design Documentation

This document gives a detailed architectural overview of CourseHub. It is written for contributors who - of course - need to understand how the repository is organized, how requests move through the system, and which design constraints already exist in code.

CourseHub is a pnpm monorepo with three main runtime pieces:

- `apps/backend`: NestJS API server, authentication, static file serving, cron jobs, logging, and operational endpoints.

- `apps/client`: Vue3 SPA used by the website visitors.

- `packages/sdk`: generated TypeScript SDK from the backend OpenAPI contract.

The project is API-first in the practical sense that the backend owns the contract, OpenAPI spec is generated based on Nest controllers and DTOs, and the frontend consumes the generated SDK.

## Motivation overview

CourseHub addresses a problem that many universities fail to solve effectively: course-related information is scattered across multiple platforms and systems. Navigating between course pages, Moodle, submission portals, and Teams groups is inefficient and difficult to track. Simply keeping track of courses becomes a cognitive burden.

CourseHub centralizes this fragmented information into a single, consistent interface.

**It allows users to:**

- Discover courses easily

- Aggregate all relevant links in one place

- Manage a personalized set of pinned courses

- Create reusable course packages from multiple courses

- Contribute to improving the dataset through suggestions

The goal is not to replace existing university systems, but to unify access to them.

CourseHub is intentionally simple: it reduces friction, removes redundancy, and provides only what an undergraduate student actually needs.

## System Overview

At runtime, the deployed system is intentionally simple:

- Currently there is no reason for the backend to run multiple instances, but it is already close to being compatible with a load-balanced architecture.

- PostgreSQL stores persistent application data.

- Redis is used as the shared cache store.

- The SPA frontend is built separately and then bundled into the backend image as static assets.

- Cloudflare sits in front of the origin in production.

- The publicly available CourseHub instance is hosted from a home server.

This means CourseHub is not a split frontend / backend deployment. Browser requests for both assets and `/api/*` ultimately terminate at the same NestJS application.

**High-level request flow:**

1. The browser loads the SPA from the backend static file server.

2. The SPA calls backend endpoints under `/api`.

3. Authentication uses Google OAuth, after which the backend sets an auth cookie.

4. Protected API calls use that cookie. Some API routes are only accessible by admin or from an internal network.

5. Postgres DB is the source of truth, while Redis and process-local caches are performance layers.

## Monorepo Structure

The repository is organized around deployable apps and shared tooling:

- `apps/backend`: NestJS app, Prisma schema, migrations, Swagger/OpenAPI generation, server-side operational logic.

- `apps/client`: Vue app, route-level pages, shared UI components, store modules, API wrappers.

- `packages/sdk`: generated client library consumed by the frontend.

- `docs`: internal documentation such as this file.

- `hosting`: production and test deployment scripts, compose files, bootstrap helpers.

- `dev-tools`: repository maintenance scripts.

- `eslint-rules`: custom lint rules that enforce project-specific backend constraints.

The root package uses Turborepo to coordinate builds, tests, and linting across workspaces.

## Database

CourseHub uses PostgreSQL through Prisma. The schema is intentionally normalized. Indexes are used where appropriate (frequently queried and/or rarely modified).

### Core Domain Model

- `University`

  - Globally unique `name` and `abbrevName`

  - Parent of faculties

- `Faculty`

  - Belongs to a university

  - Uniqueness is scoped to the parent university

  - Parent of courses

  - NOTE: currently faculty is not really used. It is introduced for future use.

- `Course`

  - Belongs to a faculty.

  - Globally unique `code`.

  - Stores multiple canonical links for the same course: official page, TAD, Moodle, submission, Teams, extra URL.

  - Many-to-many relation with users through pinned courses.

- `SuggestedCourse`

  - Staging area for user-submitted additions or corrections.

  - Accepted suggestions are converted into real domain records by admin workflows.

- `User`

  - Identified by Google account fields.

  - Stores `isAdmin`.

  - Stores pinned courses.

  - NOTE: although the User table implies that only Google OAuth is possible to be used, new auth methods can be introduced since only email address is required from the IDP.

- `CoursePackage`

  - Owned by a user and scoped to a faculty (and university implicitly).

  - Stores a reusable named collection of courses through a many-to-many relation.

  - Tracks `lastUsedAt` for usage-based lifecycle decisions and supports an admin-controlled `isPermanent` flag for packages that are exempt from inactivity-based cleanup policies.

- `ClientPing`

  - Daily usage tracking per user, platform, and normalized UTC day.

  - Designed for aggregated usage statistics collection.

  - ClientPlatform enum supports these workflows.

### Design Considerations

- The academic hierarchy is explicit: university -> faculty -> course. Note that there is intentionally no department table.

- The schema prefers relational clarity over denormalized approaches.

- Indexes are added on fields that are used for filtering and statistics, such as `facultyId`, `universityId`, `date`, and `platform`.

- `SuggestedCourse` exists to decouple community contribution from immediate publication.

- Course codes are treated as globally unique by application policy. The university abbreviation is prefixed during normalization.

- `CoursePackage` intentionally does not enforce that all linked courses belong to the same faculty. The selected faculty acts as metadata and a search boundary rather than a relational constraint on package contents.

### Data Retention

Several cleanup jobs are already part of the design. This is due to the GDPR regulation, performance and storage limitations.

- Old `ClientPing` rows are deleted after one year.

- Stale suggestions are removed automatically.

- Inactive users may be deleted after long inactivity.

- Logs, error reports, and backups each have independent retention behavior.

- Course packages are deleted together with the owning user account via cascade delete. Non-permanent packages are also deleted automatically after 12 months without use, based on `lastUsedAt`.

The codebase already treats retention and cleanup as part of normal system behavior. The DB is affected by these processes, but does not control retention policies.

Data retention also affects the Redis cache to avoid stale cache results and GDPR violations.

## Backend

The backend is a NestJS application that combines API endpoints, static asset serving, scheduled maintenance, and admin/ops endpoints.

### Module Layout

`AppModule` composes several concerns:

- Infrastructure modules: config, Prisma, logging, Redis-backed cache, scheduler, event emitter.

- Static serving of Swagger assets and frontend assets.

- Resource modules for domain endpoints.

- Global guards and exception filters.

`ResourcesModule` aggregates the main resource modules:

- University

- Faculty

- Course

- User

- Suggestion

- Client

- Statistics

- Logs

- News

- Course-package

- Database-backup

Authentication lives in its own `auth` module with Passport strategies and authorization guards.

### Authentication And Authorization

Controller methods consume authenticated context through Nest parameter decorators such as `@AuthUserId()` and `@AuthUser()`, not through `@Req()` plus transport-specific `express.Request` typing.

Authorization for protected resources are expressed through composed decorators and guards, for example owner-or-admin checks on route params, so access control stays at the controller boundary instead of being threaded through service method signatures.

This keeps services focused on domain behavior and reduces transport coupling.

### Bootstrapping and HTTP Pipeline

The backend startup sequence in `apps/backend/src/main.ts` defines the request pipeline:

- Global `/api` prefix.

- DDoS protection, CORS, HPP, Helmet, CSP with nonce, etc.

- Helmet with a custom CSP builder.

- Global validation pipe with whitelist and transformation enabled.

- Class serialization interceptor.

- Shutdown hooks, uncaught exception and unhandled rejections handling.

### Authentication

Authentication uses Google OAuth through Passport. In the future, other third party auth solutions might be introduced. There is no plan for first-party auth solutions.

The flow is:

1. The user starts login at `/api/auth/google`.

2. Google redirects back to `/api/auth/google/callback`.

3. The backend creates and signs the JWT.

4. The JWT is written to an HTTP cookie.

5. The user is redirected back to the frontend.

Important design choices:

- Authentication state is cookie-based.

- The authentication flow is secure and login CSRF-resistant, meaning a store is used to bind the entire auth flow to the initiating browser.

- The backend exposes `/api/auth/me` to resolve the current session.

- Logout is cookie invalidation, not client-only state clearing.

This reduces browser-side token exposure compared with storing bearer tokens in local storage.

### Authorization and Roles

Authorization is implemented with guards and decorators.

Current role model:

- **Public endpoints:** course search, news reads, health, version checks, etc.

- **Authenticated user endpoints:** session inspection, personal pinned-course sync, personal/shared course-package access, suggestions, client ping, error reports.

- **Admin endpoints:** content management, logs, stats, backups, user list, accepting suggestions, cache resets

There is also internal-only guard infrastructure for routes that should not be publicly callable, like metrics endpoint for Prometheus.

### API Design

The backend is resource-oriented. Controllers are thin and most logic lives in services.

The usual NestJS patterns are applied:

- DTO-based validation.

- Serializer-based response shaping.

- Custom decorators for common response metadata.

- Throttling applied per endpoint, with stricter limits on admin and mutation paths.

- Generated Swagger/OpenAPI docs in non-production environments.

### Caching Strategy

CourseHub uses more than one cache layer:

- Redis-backed Nest cache for cross-request cached objects such as users and courses.

- Process-local in-memory LRU cache for course search query results.

- Redis-backed persistent cache entries for lightweight content such as news.

The cache design is selective based on user interaction paths:

- Object reads like `user_<id>` and `course_<id>` are cached.

- Course search queries are cached locally for speed.

- Cache invalidation is driven by domain events when course relationships change.

This keeps the common read paths fast without making Redis the primary source of truth.

### Event-Driven Invalidation

The backend uses Nest event emission for cross-module coordination, mainly around cache invalidation.

**Examples:**

- When a course changes, affected user caches are invalidated.

- When a faculty or university is deleted, broad cache invalidation is triggered.

The event system is not a full asynchronous architecture. It is a scoped internal mechanism used to keep modules decoupled while preserving data freshness.

### Background Jobs

Scheduled jobs are part of the backend process and currently cover:

- Deleting inactive users.

- Deleting old suggestions.

- Deleting old client ping records.

- Deleting old error reports.

- Deleting old logs.

- Creating and pruning database backups.

The system assumes a single authoritative backend instance is responsible for these jobs. If the deployment model changes to multiple actively scheduled replicas, this area will need stronger coordination with external and centralized logging.

### Operational Endpoints

The backend contains built-in admin (operational) functionality:

- Log download and log clearing.

- Database backup generation and export.

- Error report listing and deletion.

- Usage and content statistics.

- News management.

This keeps administration inside the same auth and deployment boundary, but also means the API surface includes internal operational concerns.

Currently there are no fine-grained admin roles, like admin (for resource CRUD) and superuser for operational endpoints.

## Frontend

The frontend is a Vue3 SPA written in TypeScript and styled with UnoCSS plus app-specific CSS.

### Routing and Pages

The router contains four main pages:

- `/`: manage pinned courses.

- `/search`: search and add courses.

- `/suggest`: submit a new course or propose corrections.

- `/error-report`: submit a client error report.

Unknown routes redirect to `/`.

SEO metadata is updated on route changes.

### State Model

The frontend does not currently use Pinia but a migration might soon happen. Instead it uses composable store modules and reactive shared state.

Bootstrap behavior includes:

- Loading news.

- Resolving the authenticated user from the cookie-backed session.

- Replacing local course state with server state when authenticated.

- Showing notifications around login and restore behavior.

- Emitting client usage ping after successful authenticated initialization.

### Frontend API Consumption

The frontend consumes the generated SDK from `@coursehub/sdk`.

Common API call conventions:

- `baseURL: '/api'`.

- `withCredentials: true`.

- `throwOnError: true`.

### User Experience Model

From a product perspective, the frontend is built around three main ideas:

1. Discover courses through search.

2. Pin and manage a personal set of courses.

3. Save and reuse (enroll for) multi-course packages.

4. Improve the dataset (courses, university faculties) through suggestions.

The problem this app solves is simple, and so is the solution.

## OpenAPI and SDK

The backend generates OpenAPI from Nest metadata. The SDK package is generated from the produced `openapi.json` using `@hey-api/openapi-ts`.

The intended flow is:

1. Backend controllers and DTOs define the API contract.

2. `api:gen` produces OpenAPI.

3. `packages/sdk` generates typed client code.

4. The frontend imports SDK functions and types instead of hand-writing request contracts.

This ensures type safety and proper API usage.

## Security Model

Security is a first-class design concern in the current backend. Existing controls include:

- Strict environment validation on startup.

- JWT secret length enforcement.

- Cookie-based auth instead of storing tokens in localStorage.

- Narrow CORS configuration.

- CSP with route-aware behavior and nonces.

- Helmet headers.

- HPP protection.

- Body size limits.

- Authorization guards for auth, admin, ownership, and internal-only cases.

- Validation pipes with whitelisting.

- Throttling on essentially all endpoints.

- Path traversal protection for filesystem-backed error report access.

The system also assumes Cloudflare is part of the production defense boundary.

## Logging, Metrics, and Observability

- Logs are written to a file mounted from the host.

- `/api/health` endpoint exposes user readable status.

- `/api/metrics` endpoint exposes data for Prometheus. E.g.; event loop stats, RAM usage, CPU usage, file descriptor usage, etc.

- Admins can download or clear logs through API endpoints.

- Client error reports are stored as JSON files.

- `ClientPing` provides usage metrics.

- Statistics endpoints aggregate usage, pins, users, and course counts.

## Hosting and Deployment

### Container Model

The production image is built from the monorepo but deploys only the backend runtime plus bundled frontend assets.

**The Dockerfile:**

- Installs workspace dependencies.

- Generates Prisma client.

- Builds the backend.

- Deploys production backend dependencies into a smaller runtime environment. This is because `pnpm` requires the full repository during the build step. Then the Dockerfile creates a self-contained, pruned version of the backend.

- Copies built assets into the final image.

- Includes `curl` and `postgresql-client` for health checks and backup support.

### Runtime Services

The production compose setup expects:

- `postgres`

- `redis`

- `backend`

The backend mounts host volumes for:

- Application logs.

- Error reports.

- Database backups.

### Static Serving Model

The backend serves:

- Swagger static assets under `/swagger`.

- Frontend assets from `build/public/frontend`.

This single-origin design simplifies authentication, routing, and deployment.

### Cloudflare

The current design of CourseHub assumes Cloudflare as the CDN and edge security solution. The CSP, the permissions policy logic and throttling all account for Cloudflare-injected scripts, headers and challenge behavior.

That means Cloudflare is not just a CDN in this design. It is part of the request security model and must be considered when migrating to an other third-party solution.

## Testing and Quality Gates

CourseHub should be stable and secure. This is top priority.

Current quality mechanisms include:

- Vitest-based backend tests.

- Linting across TypeScript, JavaScript, and Vue files.

- Custom ESLint rules for backend discipline.

- OpenAPI generation as a contract artifact.

- Workspace-wide orchestration through Turbo.

Custom lint focus areas include serializer discipline, response annotation conventions, and test requirements for backend code.

## Constraints and Limitations

The architectural decisions come with deliberate tradeoffs and some fixable limitations:

- The system is implemented as a single deployable backend. This reduces operational complexity, and is sufficient for the current scale. The modular structure keeps the door open for future decomposition if needed.

- Authentication state is stored in HTTP-only cookies instead of localStorage-based bearer tokens. This reduces token exposure in the browser and simplifies secure session handling, at the cost of stricter same-origin and CORS considerations.

- The database favors relational clarity and consistency over denormalized, read-optimized structures. While the system is read-heavy, normalization ensures maintainability and correctness. Performance is addressed through indexing and caching rather than schema duplication.

- The frontend is served by the backend as static assets. This simplifies authentication, deployment, and routing, at the cost of reduced separation between frontend and backend infrastructure.

- A hybrid caching strategy is used:

  - Redis for cross-request and cross-instance caching.

  - In-memory LRU cache for ultra-fast local query results.

- The system currently supports a binary admin model. There is no separation between content management and operational privileges.

## Suggested Reads

- Privacy Policy and LIA

- Terms of Service

- SECURITY.md

- PR workflow (`pr.yaml`)

- `package.json` files and VS Code Tasks

- AGENTS.md
