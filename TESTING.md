# Backend integration tests

The Ink Model API integration tests use Vitest, Supertest, and a dedicated PostgreSQL database. They start the Express app in-process; you do not need to run `npm run start` while testing.

## 1. Configure the test database URL

Keep your existing `.env` file. Add a separate `TEST_DATABASE_URL` entry using the same PostgreSQL credentials as your development connection, but use the database name `ink_dashboard_test`.

For example:

```env
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ink_dashboard_test?schema=public"
```

Never set `TEST_DATABASE_URL` to your development database. The application and Prisma CLI both check that test mode points to a database named exactly `ink_dashboard_test`.

## 2. Create the test database

Create this database once. In PowerShell, if PostgreSQL command-line tools are on your PATH:

```powershell
createdb -U postgres ink_dashboard_test
```

Replace `postgres` with your PostgreSQL username if necessary. If the database already exists, do not create it again.

## 3. Apply migrations to the test database

From the project root, `E:\app`, run:

```powershell
$env:NODE_ENV = "test"
npx prisma migrate deploy
Remove-Item Env:NODE_ENV
```

The Prisma configuration selects `TEST_DATABASE_URL` in test mode and refuses to migrate a database with a different name.

## 4. Run the tests

From `E:\app`:

```powershell
npm test
```

Vitest sets `NODE_ENV=test` automatically. The database configuration then uses `TEST_DATABASE_URL`, never `DATABASE_URL`.

## What the Ink Model tests cover

- Creating an Ink Model and checking its initial version is `0`.
- Listing Ink Models and retrieving a detail record with its manufacturer and products.
- Updating a record and checking that its version increments.
- Rejecting stale OCC updates with HTTP `409` and verifying that the saved data is unchanged.
- Rejecting duplicate Ink Model names for the same manufacturer.
- Rejecting invalid request data.
- Deleting an Ink Model and confirming that a later read returns HTTP `404`.

Each test run creates a uniquely named manufacturer and removes only the Ink Models belonging to that manufacturer during cleanup. The test suite does not truncate tables or reset the database.
