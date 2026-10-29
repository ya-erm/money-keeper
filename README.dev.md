## Database

### ✏️ Rename `.env.example` to `.env` and fill variables

```
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
ORIGIN="..."
```

SvelteKit 3 requires Node 22.17 or later. The Docker image uses Node 24.
For a standalone Node build, run `BUILD_ADAPTER=node pnpm build`.
`ORIGIN` is read at build time as `paths.origin`; rebuild the Docker image when it changes.
Vercel builds use the automatic adapter and derive their origin from the request.

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

## Receipt organization defaults

`Transaction.receiptOrganizationName` is optional hidden metadata from the receipt's `merchant` (organization) field.
The branch's `store` label is never used as a fallback. It is independent of the editable comment and survives
the normal operation copy, journal sync, compaction and JSON import/export paths; no database migration
or inference from legacy comments is needed.

Scanning a receipt reuses the latest matching operation in the selected workspace, ordered by operation
date with an id tie-breaker. Matching ignores only letter case and whitespace. Deleted operations,
transfers, the operation being edited, and operations of the opposite direction are excluded. The latest
comment is reused even if its category has been removed; only an available category of the same direction
is suggested. Operations whose category cannot be resolved at all are omitted by the existing view-model
store. Receipts do not fall back to the unrelated comment-based category lookup on submit, including when
the organization is unavailable.

Manual comment/category edits (including clearing a comment) are preserved; a category incompatible
with the receipt direction is discarded before finding a compatible default. Repeated
scans can refresh automatic defaults. Applying before details load leaves the organization metadata absent; late
details from the dismissed scanner cannot change the operation. Manually replacing/removing the receipt
URL clears its organization metadata rather than retaining an identity for a different receipt.

Focused checks:

```sh
pnpm test:unit src/lib/receipts/organizationDefaults.test.ts src/lib/data/snapshot.test.ts
pnpm test:linux tests/receipts/organizationDefaults.test.ts
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

## PWA startup

The public `/` redirect page is prerendered and precached with its matching build assets.
Financial data and authenticated APIs are not part of this launch cache. Other routes retain
network-first document loading, so a cold deep link can still wait for its HTML response.
The inline startup screen stays visible until local data and the first real route are ready.

Run the startup checks against a production build (including the offline service-worker case):

```sh
pnpm exec playwright test --config=playwright.pwa.config.ts
```

Also check an installed iPhone PWA after deployment: first launch, repeat launch with a slow
connection, airplane-mode launch, light/dark theme, and closing/reopening after an update.
The web screen cannot render before HTML arrives on a first visit, and does not replace iOS's
native launch image. Browser emulation does not verify that OS-owned interval.

Updates wait for existing tabs/PWA windows to close so cached HTML and hashed assets remain
on the same release. Close all Money Keeper windows and reopen to activate a waiting update;
a normal reload alone may keep the old release active. Do not reuse a released application
version, since `package.json` supplies the service-worker cache version.
