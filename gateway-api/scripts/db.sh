#!/usr/bin/env bash
# usage: db.sh reset | seed | reset-and-seed
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f ../.env ]; then set -a; . ../.env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL not set}"

reset() {
  echo "dropping schema gateway + its migration history..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
DROP SCHEMA IF EXISTS gateway CASCADE;
DROP TABLE IF EXISTS atlas_schema_revisions.atlas_schema_revisions;
SQL
  echo "running migrations..."
  (cd .. && atlas migrate apply --env local)
}

seed() {
  echo "seeding..."
  for f in seeds/*.sql; do
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
  done
}

case "${1:-}" in
  reset) reset ;;
  seed) seed ;;
  reset-and-seed) reset; seed ;;
  *) echo "usage: $0 reset|seed|reset-and-seed" >&2; exit 1 ;;
esac
