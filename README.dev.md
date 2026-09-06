## Database

### ✏️ Rename `.env.example` to `.env` and fill variables

```
DATABASE_URL="..."
ORIGIN="..."
```

## Launch local database in docker

```sh
docker compose up postgres
```

### Apply migrations for production database

```sh
npx prisma migrate deploy
```

### Inspect your database with Prisma Studio

```sh
npx prisma studio
```

### How to add new migration?

```sh
npx prisma migrate dev --skip-seed --name migrationName
```

## Unit tests

Unit tests run with Vitest and cover pure modules such as the journal reducer in `src/lib/data/snapshot.ts`.

```sh
pnpm test:unit
```

## API for scripts

Every API endpoint accepts either the session cookie or the `Authorization: Bearer <token>` header.
Tokens are managed on the "API tokens" page in settings.

```sh
# Current state of all data (works only for unencrypted journals), includes `syncNumber`
curl -H "Authorization: Bearer <token>" https://<host>/api/v2/snapshot

# Journal items with order greater than `start`
curl -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"start":0}' https://<host>/api/v2/journal/get-updates

# Append items to the journal, orders must be greater than the current `syncNumber`, otherwise 409 is returned
curl -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"items":[{"order":1,"encryption":"none","data":"{\"tag\":{\"id\":\"...\",\"name\":\"...\"}}"}]}' \
  https://<host>/api/v2/journal
```

## Journal compaction

The server stores every change as a journal item. `POST /api/v2/journal/compact` replaces all items up to the
current max order N with a single `{ "snapshot": { ... } }` item at order N. Orders stay monotonic, so device sync
numbers keep working: a device that has seen N gets nothing new, a device behind N receives the snapshot (which
replaces its whole local state) followed by the items after N. Pass `syncNumber` in the body to make sure the
caller has the latest state, otherwise `409` is returned. Works only for unencrypted journals.

## E2E tests

E2E tests run with Playwright in guest mode and use local IndexedDB, so database startup is not required for the main test flow.

### Run all e2e tests

This is the same command that runs in CI. It runs Playwright inside the official Linux container, so screenshot assertions use Linux baselines both locally and in GitHub Actions.

Start Docker locally with Colima first:

```sh
colima start
```

```sh
pnpm test
```

### Debug tests with browser UI

This runs Playwright on the host machine and is intended for local debugging, not for the CI-equivalent test pass.

```sh
pnpm test:headed
```

### Update screenshot baselines

Use this after intentional UI changes in user flows:

```sh
pnpm test -- --update-snapshots
```

### Where to look at results

- Failed run artifacts are written to `test-results/`.
- Pull request runs publish the HTML report to GitHub Pages and update a PR comment with the report link.
- Published reports keep the latest 5 runs per PR and the latest 200 runs overall.
- Screenshot baselines for visual checks are stored рядом с тестами в папках `tests/**/*.test.ts-snapshots/`.
- The Playwright dev server is started automatically by the test runner.
