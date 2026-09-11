# Proverbs App

A TypeScript Proverbs workspace:

- Hono TypeScript API in `apps/api`
- Lit client app in `apps/web`
- Shared schema/contracts in `packages/contracts`
- Monorepo workspace tooling at the root

## Local development

Requires Node.js 22+ and access to the configured MongoDB server.

```bash
copy .env.example .env
npm install
```

In VS Code, use **Terminal → Run Task → Proverbs: Start development**. This starts the API and
web client in separate terminal panels so either process can restart without disrupting the other.
The API runs on port 3000 and the web client runs on port 5173 with Vite proxying API calls.

Outside VS Code, start both processes together:

```bash
npm run dev
```

Or start them individually in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

## Checks and production

```bash
npm run check
npm run build
npm start
```

The production API serves the built Lit client from `apps/web/dist`.

## API

- `GET /health`
- `GET /api/proverbs`
- `GET /api/proverbs/search?q=...`
- `GET /api/proverbs/filters`
- `GET /api/proverbs/:id`
- `GET /api/random`
- `POST /api/proverbs`
- `PUT /api/proverbs/:id`
- `DELETE /api/proverbs/:id`

The Lit client supports searching, filtering, pagination, random proverbs, and proverb creation,
editing, and deletion. Authentication from the legacy server-rendered admin is not part of the new
REST flow yet, so deploy mutation routes only behind an appropriate trusted boundary until access
control is added.
