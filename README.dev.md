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
