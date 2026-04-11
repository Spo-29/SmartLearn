#!/usr/bin/env bash
set -euo pipefail

required_vars=(DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}"
    exit 1
  fi
done

if [[ "${DB_DATABASE}" != "smartlearn" ]]; then
  echo "DB_DATABASE must currently be set to 'smartlearn' because SQL seed files are hardcoded to that database name."
  exit 1
fi

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
for attempt in $(seq 1 90); do
  if mysqladmin --protocol=TCP ping -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USERNAME}" "-p${DB_PASSWORD}" --silent >/dev/null 2>&1; then
    echo "MySQL is ready."
    break
  fi

  if [[ "${attempt}" == "90" ]]; then
    echo "MySQL did not become ready in time."
    exit 1
  fi

  sleep 2
done

MYSQL_CMD=(mysql --protocol=TCP -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USERNAME}" "-p${DB_PASSWORD}")

echo "Applying schema SQL files..."
grep -v '^CREATE DATABASE IF NOT EXISTS' database/migrations/001_init_tables.sql | "${MYSQL_CMD[@]}"
"${MYSQL_CMD[@]}" < database/migrations/002_ai_analysis_and_quizzes.sql

echo "Checking seed state..."
category_count=$("${MYSQL_CMD[@]}" -Nse "SELECT COUNT(*) FROM smartlearn.categories;" 2>/dev/null || echo "0")
if [[ "${category_count}" == "0" ]]; then
  echo "Seeding base data..."
  "${MYSQL_CMD[@]}" < database/migrations/seed_data.sql
else
  echo "Seed data already present; skipping seed_data.sql."
fi

echo "Database bootstrap completed."
