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

## E2E tests

E2E tests run with Playwright in guest mode and use local IndexedDB, so database startup is not required for the main test flow.

### Run all e2e tests

```sh
pnpm test
```

### Run tests with browser UI

```sh
pnpm test:headed
```

### Update screenshot baselines

Use this after intentional UI changes in user flows:

```sh
pnpm exec playwright test --update-snapshots
```

### Where to look at results

- Failed run artifacts are written to `test-results/`.
- Screenshot baselines for visual checks are stored рядом с тестами в папках `tests/**/*.test.ts-snapshots/`.
- The Playwright dev server is started automatically by the test runner.
