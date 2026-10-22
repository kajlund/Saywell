# Saywell

Saywell is a personal collection of sayings and quotations, replacing Proverbs. It supports search, filters, pagination, favorites, random sayings, editing and JSON takeout. Existing `proverbs` package, API and database identifiers are retained intentionally.

## Repository

- `apps/api/src`: Hono API, Zod environment validation, Mongoose model/services and Node startup; `apps/api/test`: mocked-service route tests.
- `apps/web/src`, `public`: Lit UI and assets; `apps/web/test`: happy-dom component and mocked-fetch tests; Vite supplies development serving and production bundles.
- `packages/contracts/src`, `test`: shared Zod schemas/types and synthetic contract tests. Contracts export TypeScript source and have no separate build.
- Root: private ESM npm workspaces, one committed v3 lockfile, shared ESLint/Prettier tooling. `scripts/` currently contains no tooling files.
- `docs/`: design references and [standardization audit](docs/dreamquest-standardization.md).

## Development

DreamQuest targets Node.js 24 LTS; `.nvmrc` selects major 24. Compatibility checks are currently blocked by local NVM trust enforcement, so the existing `>=22` engine declaration has not yet been narrowed. Use npm from a trusted installation and confirm `node --version` and `npm --version`.

From the repository root:

```powershell
npm ci
Copy-Item .env.example apps/.env
npm run dev
```

Configure a development MongoDB instance before starting the API. **The current startup loader reads `apps/.env`, not root `.env`**, in both source and compiled layouts. Existing process variables take precedence. Root `.env` alone has no effect unless external tooling injects it. This path behavior is preserved pending an explicit configuration decision.

The API defaults to port 3000; Vite runs on 5173 and proxies `/api` and `/health` to `127.0.0.1:3000`. Changing PORT also requires reviewing the fixed development proxy. VS Code's existing **Proverbs: Start development** task launches separate API/web panels; its historical identifier is retained.

## Commands

Run from root. Install development dependencies for validation and builds (`npm ci --include=dev` if your environment would otherwise omit them).

| Command                              | Behavior                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `npm run dev`                        | Concurrent API tsx watch and Vite client                                       |
| `npm run dev:api`, `npm run dev:web` | Start either development process                                               |
| `npm run build`                      | Compile API then typecheck/bundle web; contracts intentionally have no build   |
| `npm start`                          | Start compiled API through its workspace                                       |
| `npm test`                           | Run real API, web and contracts Vitest suites once; missing scripts/tests fail |
| `npm run lint`                       | ESLint, zero warnings allowed                                                  |
| `npm run format`                     | Write Prettier formatting; scope edits to avoid unrelated changes              |
| `npm run format:check`               | Check supported nonignored files without writing                               |
| `npm run typecheck`                  | Require typechecks in all three workspaces, including tests                    |
| `npm run check`                      | Typecheck, lint, then tests; stop on first failure                             |

`npm run lint:fix` applies lint fixes. Run check, format:check and build before submitting changes. Tests use synthetic data, mocked services/fetch and happy-dom; they do not connect to MongoDB. There is no database integration suite or migration runner. Never supply production data to future integration tests; use an explicitly configured disposable test database.

Strict TypeScript settings are retained. API build emits source only into `apps/api/dist`; Vite emits `apps/web/dist`. Contracts remain source exports. Web source/tests are typechecked; `vite.config.ts` is outside the web tsconfig include list.

## Configuration and MongoDB

| Variable     | Default / requirement                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| `NODE_ENV`   | `development`; accepts `development`, `production`, `test`                     |
| `PORT`       | `3000`; integer 1–65535                                                        |
| `MONGO_URI`  | `mongodb://127.0.0.1:27017/proverbs`; nonempty string, not full URI validation |
| `LOG_LEVEL`  | `info`; fatal/error/warn/info/debug/trace/silent                               |
| `WEB_ORIGIN` | `http://localhost:5173`; set actual browser origin in production               |

Use the intended database, credentials, authentication database, TLS and network permissions for your MongoDB deployment. Keep credentials in ignored environment files or externally injected variables. Preserve the existing production database and `Proverb` model/collection decisions. Startup awaits the initial MongoDB connection (5-second connection/selection timeouts); it performs no application migration/import/export. Model/index behavior is unchanged. `/health` reports process health without a fresh database query.

## Production and DreamQuest deployment

Build with development dependencies available, then use `NODE_ENV=production` and the existing environment injection. `npm start` delegates to `@proverbs/api`, which runs `node dist/server.node.js` with workspace cwd `apps/api`. Static paths resolve to sibling `apps/web/dist`; a direct Node invocation requires that same working directory. Production mode avoids the development-only pino-pretty transport after pruning.

Before deployment, verify compiled startup and source-export `@proverbs/contracts` loading with Node 24 after `npm prune --omit=dev`. A TypeScript build alone does not establish that runtime workspace loading works.

The existing external `../../deploy.ps1` and `../../deploy.apps.json` define the `Saywell` deployment: `/srv/storage/apps/saywell`, systemd service `saywell`, environment `/etc/saywell/saywell.env`, health `http://127.0.0.1:5008/health`. The script archives/uploads the checkout, installs/builds in staging, prunes development dependencies, activates, starts the service and checks health with rollback on failure. No deployment files or operational identifiers were changed. Live service, Caddy and server configuration were not inspected.

The deployer links environment configuration at repository root, while startup reads `apps/.env`; verify systemd injects the required variables before relying on this workflow. Confirm service command/cwd, Node runtime, port, browser origin, workspace links, static assets and intended MongoDB target in staging. Health success alone does not verify database operations or the UI.

Git ignores do not govern the deployment tar archive. Its exclusions cover dependencies, Git, environment files, logs and TypeScript metadata, but private imports/exports/backups/data can still be packaged. Review the archive from a clean checkout before deployment; packaging changes require separate review.

## API and data protection

Routes include `/health`, `/api/proverbs`, `/api/proverbs/search`, `/api/proverbs/filters`, `/api/proverbs/:id`, `/api/random` and `/api/config/export`. Create/update/delete use POST/PUT/DELETE. The export endpoint returns a JSON attachment. Authentication from the legacy admin is not present in this REST flow: mutation and personal-data export routes require an appropriate trusted access boundary. CORS is not authentication.

Keep personal JSON/CSV imports, takeouts, MongoDB dumps and backups under ignored `imports/`, `exports/`, `data/` or `backups/`. Environment variants, common database files, keys and Saywell/Proverbs takeout names are ignored; synthetic CSV/TSV fixtures under `test/fixtures` remain trackable. Arbitrary JSON elsewhere is not automatically private, and ignores do not untrack previously committed files. Review staged files and deployment archives. Never commit actual credentials or stored sayings. No application data was accessed by this maintenance pass.
