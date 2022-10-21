## Database

### ✏️ Rename `.env.example` to `.env`

```
DATABASE_URL="file:./dev.db"
```

### 🔨 Create the database from the Prisma schema

```sh
npx prisma db push
```

### 🔎 Inspect your database with Prisma Studio

```
npx prisma studio
```
