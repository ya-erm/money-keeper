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
