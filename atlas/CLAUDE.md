# Atlas Migrations

This folder contains database migrations managed by [Atlas](https://atlasgo.io/).

## Overview

The desired Postgres schema lives in `atlas/schema/` (native Atlas HCL, one file per domain). `pnpm db:generate` diffs that directory against `atlas/migrations/` and writes a SQL migration. This is the **only** way to create new migrations — do not regenerate the lockfile from a live database.

| File                 | Contents                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_public.hcl`        | `schema "public"`                                                                                                                                                                              |
| `enums.hcl`          | Postgres enums, except those a domain file declares beside its tables (`oauth.hcl`, `irl.hcl`)                                                                                                 |
| `tenancy.hcl`        | Teams, data rooms, membership, groups                                                                                                                                                          |
| `auth.hcl`           | Domain auth rules, login codes, auth audit log, TOTP                                                                                                                                           |
| `oauth.hcl`          | OAuth server: registrations, clients, consents, tokens, redirect blocks                                                                                                                        |
| `user.hcl`           | Users, notifications, home-page layout, saved finding views                                                                                                                                    |
| `documents.hcl`      | Documents, folders, assignees, rename patterns, IRL classification outcomes                                                                                                                    |
| `irl.hcl`            | IRL: master taxonomy, per-team library (templates, categories, uploaded IRL files), per-data-room categories with answers, assignees, comments, the re-filing pass, and the four `irl_*` enums |
| `findings.hcl`       | Findings (`risk*`) and spotting-agent state                                                                                                                                                    |
| `deal_context.hcl`   | Deal-context runs, ranked observations, and their sources                                                                                                                                      |
| `report.hcl`         | Data room report (v2): report row, deal-fact snapshots, Annex B tables/columns/rows/cells, team report template                                                                                |
| `chat.hcl`           | Chat sessions, messages, agent ticks                                                                                                                                                           |
| `tabular_review.hcl` | Playbooks, preset runs, tabular-review answers                                                                                                                                                 |
| `qna.hcl`            | QnA batches, questions, comments                                                                                                                                                               |
| `vdr.hcl`            | VDR integrations and folder candidates                                                                                                                                                         |
| `parties.hcl`        | Parties and cap-table tables                                                                                                                                                                   |
| `ingestion.hcl`      | Ingestion sessions                                                                                                                                                                             |
| `guests.hcl`         | Guest groups                                                                                                                                                                                   |
| `infra.hcl`          | Queues, caches, audit, usage, Slack, support chat                                                                                                                                              |

## Commands

```bash
# Generate migration from schema changes
pnpm db:generate        # or: pnpm atlas:diff

# Apply pending migrations
pnpm db:migrate         # atlas migrate apply --env local (SQL only; no lockfile)

# Check migration status
pnpm atlas:status

# Rehash after manual migration edits
pnpm atlas:hash

# Validate migration integrity
pnpm atlas:validate
```

## Standard Workflow

### Adding/Modifying Tables or Columns

1. Edit the matching file under `atlas/schema/` (add or change the `table` / `column` / `index` / `foreign_key` block)
2. If a TypeScript enum value changed, update `src/api-models/<domain>/enums.ts`
3. Run `pnpm db:generate`
4. Review generated SQL in `atlas/migrations/`
5. Run `pnpm db:migrate` to apply
6. **If the change touches a table consumed by Rust workers**, regenerate the
   Diesel schema afterwards — see `rust-monorepo/AGENTS.md` § db-client Conventions
   for the command and rationale. Skip this and you create silent drift between
   `rust-monorepo/crates/db-schema/src/schema.rs` and the live DB; current code
   may compile (especially if it uses `sql_query`), but future Diesel-typed
   queries against the new column/table will fail to compile in confusing ways.

### Adding Enum Values

PostgreSQL supports adding enum values easily:

1. Add the value to the TypeScript enum in `src/api-models/<domain>/enums.ts`
2. Add the same value to the `enum` block in `atlas/schema/enums.hcl`
3. Run `pnpm db:generate` - Atlas generates `ALTER TYPE ... ADD VALUE`
4. Run `pnpm db:migrate`
5. **If the enum is consumed by Rust workers** (mapped in `rust-monorepo/crates/db-schema/src/enums.rs`),
   add the new variant there too and regenerate `schema.rs` — see
   `rust-monorepo/AGENTS.md` § db-client Conventions.

**Anything that _uses_ the new value goes in a separate, later migration.** Postgres
refuses to reference an enum value in the same transaction that added it
(`ERROR: unsafe use of new value "x" of enum type`), and Atlas runs each migration
file in one transaction. So a column `DEFAULT` that names the value, a backfill
`UPDATE` that writes it, and a `CHECK` that mentions it all belong in the next
migration, not alongside the `ALTER TYPE ... ADD VALUE`.

This is easy to miss because nothing fails at generate time: adding a value to
`enums.hcl` and widening a column default in the same pass produces one file that
only breaks when it is applied. Widening a default is also the case where forgetting
the second half is silent — the column keeps its old default and every existing row
keeps its old array, so the feature ships switched off for every user.

## Complex Operations

### Removing Enum Values (3-Step Pattern)

> The procedure built on this pattern — the checkpoints, the value mapping the user
> owns, and the Rust/call-site follow-up — is `/schema-change` → `enum-removal.md`.

PostgreSQL does not support removing values from an enum type. Use this 3-step migration pattern:

#### Naming Conventions

| Layer      | Original (keeps old values) | Temp (without removed value) | Final State           |
| ---------- | --------------------------- | ---------------------------- | --------------------- |
| TypeScript | `MyEnum`                    | `MyEnumTemp`                 | `MyEnum` (updated)    |
| PostgreSQL | `my_enum`                   | `my_enum_temp`               | `my_enum` (renamed)   |
| Column     | `my_column`                 | `my_column_temp`             | `my_column` (renamed) |

#### Step 1: Add temp enum and temp column

Add `enum "my_enum_temp"` (without the removed value) in `atlas/schema/enums.hcl` and a nullable `my_column_temp` column on the table in its domain file. Mirror the same names in `src/api-models/<domain>/enums.ts`:

```hcl
enum "my_enum_temp" {
  schema = schema.public
  values = ["value1", "value2"]
}
```

Run `pnpm db:generate` to create:

```sql
CREATE TYPE "my_enum_temp" AS ENUM ('value1', 'value2');
ALTER TABLE "my_table" ADD COLUMN "my_column_temp" "my_enum_temp" NULL;
```

#### Step 2: Migrate data (manual SQL)

Create a manual migration file in `atlas/migrations/` with timestamp-only naming (e.g., `20260113120000.sql`):

```sql
-- Copy values that exist in both enums
UPDATE "my_table"
SET "my_column_temp" = "my_column"::text::"my_enum_temp"
WHERE "my_column" IS NOT NULL
  AND "my_column"::text != 'removed_value';

-- Map removed value to a replacement (developer decides the mapping)
UPDATE "my_table"
SET "my_column_temp" = 'value1'::"my_enum_temp"
WHERE "my_column"::text = 'removed_value';
```

Run `pnpm atlas:hash` after creating the file.

#### Step 3: Finalize migration

In `atlas/schema/`, drop the old column and old enum, then rename the temp column/enum back to the original names. Update `src/api-models/<domain>/enums.ts` the same way. Run `pnpm db:generate`. You may need to manually adjust to ensure it:

```sql
ALTER TABLE "my_table" DROP COLUMN "my_column";
ALTER TABLE "my_table" RENAME COLUMN "my_column_temp" TO "my_column";
DROP TYPE "my_enum";
ALTER TYPE "my_enum_temp" RENAME TO "my_enum";
```

Run `pnpm atlas:hash` if you made manual edits.

### Manual Migrations

For complex operations that Atlas can't auto-generate:

1. Create a file in `atlas/migrations/` with timestamp-only naming: `YYYYMMDDHHMMSS.sql` (no description suffix)
2. Write the SQL
3. Run `pnpm atlas:hash` to update checksums
4. Run `pnpm db:migrate` to apply

### Reviewing Generated Migrations

Always review Atlas-generated migrations before applying:

- Check for unintended `DROP` statements
- Verify column types and constraints
- Ensure data migrations are handled if needed

### `CREATE INDEX CONCURRENTLY` — when and how

`CREATE INDEX` (the form Atlas generates by default) holds an
`ACCESS EXCLUSIVE` lock on the table for the duration of the index build,
which blocks writes. `CREATE INDEX CONCURRENTLY` avoids that lock but comes
with real failure-handling tradeoffs. **Default to plain `CREATE INDEX`.**
Only reach for `CONCURRENTLY` when the lock window genuinely matters — i.e.
on very large or write-heavy production tables where seconds of blocked
writes are unacceptable (`document`, `document_chunk`, `audit_log` historically,
and similar). Moderate-sized tables (per-user / per-team rows) are usually
fine with the plain form.

If you do use `CONCURRENTLY`, follow these rules:

- **One statement per migration.** PostgreSQL forbids `CONCURRENTLY` inside
  a transaction, so the migration must declare `-- atlas:txmode none` at the
  top. That disables transactional rollback for the whole file, so any other
  DDL/DML in the same migration loses atomicity. Put the `CREATE INDEX
CONCURRENTLY` in its own migration file; keep `ALTER TABLE`, backfill
  `UPDATE`s, and `SET NOT NULL` in a separate, transactional migration that
  runs first.
- **Don't use `IF NOT EXISTS` with `CONCURRENTLY`.** A failed concurrent
  build leaves an _invalid_ index behind (`indisvalid = false`) — the
  planner ignores it but the name is taken. `IF NOT EXISTS` then silently
  skips on retry and you ship with a useless index. Recovery is manual:
  `DROP INDEX CONCURRENTLY "<name>";` then re-run the migration.
- After editing the file, run `pnpm atlas:hash` to update `atlas.sum`.

## Configuration

Atlas configuration is in `atlas.hcl` at the project root. Key settings:

- `schema.src`: `file://atlas/schema` — directory of domain HCL files (diff/generate only)
- `dev`: Uses a Docker PostgreSQL container for diffing (`docker://postgres/16/dev`)
- `url`: Target database (`DATABASE_MIGRATIONS_URL` when set, else `DATABASE_URL`)
- `migration.dir`: Points to `atlas/migrations/`
- `migration.exclude` / `exclude = ["drizzle"]`: leftover audit tables, extra trgm/GIN indexes, and the `drizzle` schema stay out of desired state

Deployed apply (`atlas.deployed.hcl`, `Dockerfile.migrations`) has **no** `schema.src`. It applies `atlas/migrations/` after `scripts/migrate-deployed.sh` refuses a non-`BYPASSRLS` role.

## CI gates

The Node `migrations` job runs four commands, in order:

1. `pnpm atlas:sanity-check` — existing `atlas/migrations/*.sql` and `atlas.sum` entry lines are immutable vs `origin/main`. Does not read `atlas/schema/`.
2. `pnpm atlas:validate` — checksum + SQL integrity against the `docker://` scratch DB. No lockfile.
3. `pnpm db:migrate` — `atlas migrate apply --env local`.
4. `pnpm atlas:status && pnpm atlas:diff:check` — lockfile and migrations agree (`The migration directory is synced with the desired state, no changes to be made`). `diff:check` diffs the desired state in `file://atlas/schema` against the `docker://` scratch DB.

Rust CI apply is the same `pnpm db:migrate` path. `scripts/check-no-diesel-migrations.sh` fails the build if a Diesel `migrations/` directory lands under `rust-monorepo/`.

## Rebasing Migrations After Git Merge / Rebase

When merging or rebasing a feature branch against main, `atlas.sum` conflicts whenever both sides added migrations. With the conflict still in the working tree, run:

```bash
make rebase-migrations
# or: ./scripts/rebase-migrations.sh [base_ref]
```

`base_ref` defaults to `MERGE_HEAD` (the exact commit being merged) during a merge, otherwise `main` — pass it explicitly when rebasing onto something else (e.g. `origin/main`).

The script finds the migrations that don't exist on the base ref, regenerates `atlas.sum` with `pnpm atlas:hash` (this clears the conflict markers — `atlas migrate rebase` refuses a conflicted sum file), then renames them to fresh timestamps after main's latest in a single call:

```bash
pnpm atlas:rebase -- <file1>.sql <file2>.sql   # filenames only, no path
```

`atlas migrate rebase` also accepts an `A...B` version range, but the script deliberately passes explicit filenames: a range would also rename main's migrations timestamped between two branch migrations.

Then stage and continue:

```bash
git add atlas/migrations/
git merge --continue   # or git rebase --continue
```

## Troubleshooting

### "migrations checksum mismatch"

Run `pnpm atlas:hash` to recalculate checksums (no need to make any manual edits).

### "migration file X.sql was added out of order"

A file was merged with a version lower than the latest already-applied migration (two PRs generated overlapping timestamps). Atlas refuses to apply it: https://atlasgo.io/versioned/apply#non-linear-error

Do not change `exec_order` in `atlas.deployed.hcl`. Rebase the out-of-order file onto a timestamp after the directory's latest:

```bash
pnpm atlas:rebase -- <file>.sql   # filename only, no path
```

If the file is already on main, include `[skip-migration-sanity-check]` in the commit message — renaming is the documented exception to migration immutability. The tag is honoured on any commit since `origin/main`, not only `HEAD`: pull_request CI checks out a merge commit whose message would otherwise miss it.

### "SSL is not enabled on the server"

Ensure `DATABASE_URL` includes `?sslmode=disable` for local/CI databases.

### Viewing Current State

```bash
# Check what migrations have been applied
pnpm atlas:status

# Validate migration files
pnpm atlas:validate
```
