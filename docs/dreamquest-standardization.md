# DreamQuest standardization — Saywell

Date: 2026-10-22. Phase 2G conservative repository maintenance. Initial working tree clean. No AGENTS.md was found in repository inventory or checked ancestors.

All six reference documents were available and reviewed: Linksmith conventions, Activus audit, and Penga, Healthz, TaskBook and Mise standardization reports at the requested sibling paths. Guidance adopted: meaningful root gates, scoped environments, reproducible npm installs, honest runtime/security evidence and private-data safeguards. Their architectures and vulnerability results are not requirements or evidence for Saywell.

## 1. Initial audit findings

| Finding                                                                                 | Classification                               | Action                                                                                              |
| --------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Root check starts with format/lint; workspace validation silently skips missing scripts | Safe standardization improvement             | Require workspace typecheck/test; sequence typecheck, lint, tests with `&&`                         |
| Web/contracts allow empty test suites despite real tests                                | Safe standardization improvement             | Remove passWithNoTests                                                                              |
| Node/browser globals enabled everywhere                                                 | Safe standardization improvement             | Scope API/tooling to Node, web source/tests to browser; contracts receive neither broad environment |
| Root Node >=22, no major-version hint                                                   | Decision required                            | Add .nvmrc 24; defer engine narrowing until compatibility verification                              |
| Limited private-data/generated ignores                                                  | Safe standardization improvement             | Expand Git and formatter exclusions; preserve fixture exceptions                                    |
| README describes Proverbs and omits actual environment/deployment constraints           | Saywell-specific concern                     | Rewrite current-facing setup, commands and operational guidance; retain historical identifiers      |
| Dotenv startup path is apps/.env, not root .env                                         | Saywell-specific concern / decision required | Document actual path and process-variable precedence; do not change loading behavior                |
| Source-export contracts consumed by compiled API                                        | Decision required                            | Verify production Node loading with linked workspace after pruning; defer export/build changes      |
| MongoDB/Mongoose, shared contracts, private ESM workspaces                              | Acceptable architectural difference          | Preserve architecture, models, indexes, API and UI                                                  |
| Strict shared TypeScript and Lit compiler options                                       | Acceptable architectural difference          | Preserve strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, NodeNext/Bundler split       |
| Deployment tar can include Git-ignored private data                                     | Decision required                            | Document packaging review; do not modify deployment script                                          |
| REST has no authentication; export returns personal collection                          | Saywell-specific concern / decision required | Retain existing boundary warning and include export; no access-control implementation               |

Root package uses apps/* and packages/* workspaces, a single committed npm v3 lockfile and common tool ownership. API owns Hono/Mongoose/Pino/dotenv and contracts; web owns Lit/icons and Vite/happy-dom tooling; contracts owns Zod. All three have real Vitest suites. No extra package-manager or workspace lockfile was found. scripts/ is currently empty. No local deployment script, Dockerfile or Compose file is tracked.

API typecheck covers source/tests; build emits only source and source maps into dist. Web typecheck covers source/tests but not vite.config.ts. Contracts have no build and export ./src/index.ts. Root build preserves optional build orchestration because contracts intentionally have no build step. API/web build order and development proxy behavior remain unchanged. Tests mock API services and client fetch, exercise DOM behavior and validate synthetic contracts; they do not start the server or connect to MongoDB. No database integration, migration runner or coverage threshold is configured.

## 2. Changes implemented

- package.json: required workspace validation scripts and sequential typecheck/lint/test check; build/format remain separate gates.
- apps/web/package.json and packages/contracts/package.json: test discovery must find real tests.
- .nvmrc: major 24 hint with no exact patch pin or runtime installation change.
- eslint.config.mjs: Node globals for API/scripts/tool configs; browser globals for web source/tests. Existing rules and Prettier integration retained.
- .gitignore and .prettierignore: private credentials/environment/data/import/export/dump/backup material, takeout filenames and temporary/generated output. Synthetic CSV/TSV fixture exceptions retained.
- .env.example: explain actual startup path, development database intent and production overrides; preserve default database name and values.
- README.md: Saywell identity, workspace inventory, setup, commands, configuration, MongoDB, tests, compiled startup and existing deployment evidence.
- This report.

No source logic, schema, database record, API contract, UI, import/export implementation, dependency declaration/version, lockfile resolution or deployment file changed. No actual .env contents or MongoDB records were inspected. Tracked filename inventory found no private database/export payload to remove; inline synthetic fixtures remain intact. No install, migration, import, export, server start, commit, push or deployment was performed.

Ignore safeguards are preventive rather than a historical secret scan. Arbitrary JSON/SQL/archive formats outside private directories still require staging review. Git, formatter and deployment packaging exclusions operate independently.

## 3. Acceptable architectural differences

Keep MongoDB/Mongoose rather than SQL tooling, the Proverb model and collection decisions, source-export shared contracts, all real API/web/contracts tests, happy-dom, Hono/Lit, npm workspace boundaries and existing dependency ranges. No Drizzle dependency is present. Preserve root proverbs name and @proverbs workspace names, routes, database default and VS Code task identifiers despite current Saywell branding.

Keep compiled API startup through npm workspace cwd, static serving from ../web/dist, development-only Pino transport and the initial database connection requirement. Startup has no application migration step; Mongoose model/index behavior is untouched. Health reports process status without continuously querying MongoDB or testing static/client behavior.

Root >=22 engine and matching lockfile metadata remain unchanged pending real Node 24 validation. This is an existing broad declaration, not a newly verified support promise. No future major version was tested. The new .nvmrc selects 24 without modifying the server runtime.

## 4. Dependency security

Initial node --version returned v26.12.0; initial npm --version was blocked. With .nvmrc, node --version returned v24.22.1. npm version, both audits and outdated were attempted with Node 24 and all rejected by NVM4306 before npm execution: delegated npm-cli.js is not trusted. No trust control was changed or bypassed.

| Scope                                      | Result                                         |
| ------------------------------------------ | ---------------------------------------------- |
| Production: npm audit --omit=dev           | Unknown; blocked before execution              |
| Full tree including development: npm audit | Unknown; blocked before execution              |
| Outdated direct/transitive inventory       | Unknown; npm outdated blocked before execution |

No advisory names, severity counts, production/development paths or potential fix versions could be obtained. These are not clean audit results. Repair trusted npm separately, rerun both audits, then classify actual dependency paths and review available fixes as a separate maintenance task. Do not infer development-only findings by simply subtracting headline counts or adopt sibling vulnerability results. No update, audit fix, forced fix, override or lockfile regeneration occurred.

## 5. Shared direct dependency inventory

Static manifest and committed-lock inventory; locked versions do not prove installed-tree state. R=root, A=API, W=web, C=contracts. All rows below are direct dependencies in the listed owner; dev indicates development ownership.

| Package                | Declared / owner   | Locked                               |
| ---------------------- | ------------------ | ------------------------------------ |
| TypeScript             | ^5.9.2 R/A/W/C dev | 5.9.3                                |
| ESLint                 | 10.10.0 R dev      | 10.10.0                              |
| @eslint/js             | 10.0.1 R dev       | 10.0.1                               |
| typescript-eslint      | 8.69.0 R dev       | 8.69.0                               |
| eslint-config-prettier | 10.1.8 R dev       | 10.1.8                               |
| globals                | 14.0.0 R dev       | 14.0.0                               |
| Prettier               | 3.9.6 R dev        | 3.9.6                                |
| Hono                   | ^4.9.6 A           | 4.13.7                               |
| @hono/node-server      | ^1.19.1 A          | 1.19.17                              |
| @hono/zod-validator    | ^0.7.2 A           | 0.7.6                                |
| Lit                    | ^3.3.1 W           | 3.3.3                                |
| Mongoose               | ^8.18.0 A          | 8.24.4                               |
| Vitest                 | ^3.2.4 R/A/W/C dev | 3.2.7                                |
| Vite                   | ^7.1.3 W dev       | 7.3.6                                |
| tsx                    | ^4.20.5 A dev      | 4.23.13                              |
| Zod                    | ^4.1.5 A/C         | 4.5.4                                |
| dotenv                 | ^17.2.1 A          | 17.4.2                               |
| Pino                   | ^9.9.0 A           | 9.14.0                               |
| pino-pretty            | ^13.1.1 A dev      | 13.1.3                               |
| happy-dom              | ^20.12.0 W dev     | 20.14.0                              |
| concurrently           | ^10.0.5 R dev      | 10.0.5                               |
| @types/node            | ^24.3.0 A dev      | 24.13.3                              |
| @phosphor-icons/web    | ^2.1.2 W           | 2.1.2                                |
| @proverbs/contracts    | * A/W              | Local workspace 1.0.0, source export |

MongoDB driver mongodb 6.20.0 is transitive through Mongoose. Rollup 4.63.1 and esbuild 0.28.2 are transitive tooling, not direct declarations. Vite is direct web tooling and also used by Vitest. No Rolldown or Drizzle ORM/Kit dependency was found.

## 6. Cross-platform lockfile review

The committed lockfile records the Linux x64 native optional dependencies required by the inspected tooling parents, with matching versions, OS/CPU metadata and optional flags:

| Parent         | Required Linux x64 entries present                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| esbuild 0.28.2 | @esbuild/linux-x64 0.28.2                                                                                    |
| rollup 4.63.1  | @rollup/rollup-linux-x64-gnu 4.63.1; @rollup/rollup-linux-x64-musl 4.63.1; @napi-rs/lzma-linux-x64-gnu 1.5.1 |

No missing Linux x64 entry or Rolldown-specific correction was identified. The lockfile was neither deleted nor regenerated. Static completeness is not evidence of a successful Linux installation/build: verify npm ci with optional dependencies enabled, build and compiled startup on Linux x64 before deployment. No Linux runtime was used during this pass.

## 7. Verification results

All requested npm validation commands exist and perform real work. Each was attempted under selected Node 24:

| Check                | Result                                      |
| -------------------- | ------------------------------------------- |
| node --version       | v24.22.1 after hint; runtime selection only |
| npm --version        | Blocked: NVM4306                            |
| npm run typecheck    | Blocked before script execution: NVM4306    |
| npm run lint         | Blocked before script execution: NVM4306    |
| npm test             | Blocked before script execution: NVM4306    |
| npm run check        | Blocked before script execution: NVM4306    |
| npm run format:check | Blocked before script execution: NVM4306    |
| npm run build        | Blocked before script execution: NVM4306    |
| npm audit --omit=dev | Blocked: NVM4306                            |
| npm audit            | Blocked: NVM4306                            |
| npm outdated         | Blocked: NVM4306                            |

This execution-environment blocker predates changes. No passing application checks, test count, formatting compliance, clean audit or Node 24 compatibility is claimed. No application-check failures can be attributed or fixed until those tools execute. Local version-manager trust repair (NVM suggests trusted reinstall or reshim) is outside repository maintenance. Rerun all listed commands after repair.

Static checks passed: all four package manifests and the lockfile parse as JSON; `node --check eslint.config.mjs`; `git diff --check`; private environment/export/backup/data/CSV/build path ignore probes. `.env.example` and synthetic CSV/TSV fixture paths remain trackable. Final diff review confirmed no source or lockfile changes. These checks do not replace npm validation. Git warns that the edited .gitignore working copy has CRLF that will normalize to LF; an attempted in-place LF normalization was denied by filesystem access controls, without preventing the ignore additions or diff validation.

## 8. Remaining decisions and manual deployment verification

1. Repair trusted npm, run all gates and audits, then narrow root engine and matching lock metadata to 24.x after compatibility is established. No dependency upgrades belong in this phase.
2. Resolve root versus apps/.env loading deliberately. Current server.node.ts uses ../../../.env relative to src/dist, resolving to apps/.env. Existing process variables win. The external deployer links repository-root .env; confirm actual systemd environment injection before deployment rather than assuming the link is read.
3. Verify source-export @proverbs/contracts resolution under plain Node 24 with workspace links and production-only installation. A successful tsc build cannot establish Node's TypeScript loading behavior. Review any compiled-export strategy separately.
4. External ../../deploy.apps.json declares Saywell service saywell, /srv/storage/apps/saywell, /etc/saywell/saywell.env and http://127.0.0.1:5008/health. ../../deploy.ps1 archives/uploads, stages npm ci/build, prunes dev dependencies, activates/starts and checks health with rollback. These files were inspected read-only; live systemd/Caddy/runtime configuration was not inspected. Verify command/cwd, environment, production mode, runtime, browser origin, port, DB target, static assets and source workspace links in staging. Keep existing operational names and database decisions.
5. Build requires development dependencies. Production must set NODE_ENV=production after pruning because pino-pretty is dev-only. Root npm start supplies API workspace cwd; direct invocation must reproduce it for relative static paths. Fixed development proxy still targets port 3000 even when PORT changes.
6. Review deployment archive contents from a clean checkout. Tar excludes dependencies/Git/env/logs/tsbuildinfo but not all ignored private directories. No packaging or deployment script changes were authorized for implementation in this phase.
7. Confirm a trusted access boundary for collection reads, mutation and takeout; CORS does not authenticate. Access-control changes require a separate production decision. No export endpoint was called.
8. Verify backup/restore and explicitly disposable test-database procedures before any future data operations. Existing health is limited process evidence; it is not database or UI readiness. No production database verification occurred.

## 9. Future cross-application dependency management

Compare declared ranges and locked resolutions separately, retain runtime/dev ownership and evaluate peer/runtime constraints before aligning tools. TypeScript 5.9, ESLint 10/typescript-eslint 8, Vitest 3/Vite 7, Hono 4/Zod 4/Lit 3 should be tested together rather than mechanically copied from sibling apps. Mongoose/MongoDB and source-export contracts have their own compatibility requirements. Shared command naming does not require SQL tooling, compiled contracts or another repository's workspace layout. Keep platform optional-dependency inspection, security audits, runtime selection and successful Linux production verification as distinct evidence.
