#!/usr/bin/env bash
set -euo pipefail

required_vars=(DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}"
    exit 1
  fi
done

MYSQL_SSL_MODE="${MYSQL_SSL_MODE:-PREFERRED}"

mysql_tls_args=(--ssl-mode="${MYSQL_SSL_MODE}")
if [[ -n "${MYSQL_ATTR_SSL_CA:-}" ]]; then
  mysql_tls_args+=(--ssl-ca "${MYSQL_ATTR_SSL_CA}")
fi
if [[ -n "${MYSQL_SSL_CERT:-}" ]]; then
  mysql_tls_args+=(--ssl-cert "${MYSQL_SSL_CERT}")
fi
if [[ -n "${MYSQL_SSL_KEY:-}" ]]; then
  mysql_tls_args+=(--ssl-key "${MYSQL_SSL_KEY}")
fi

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
for attempt in $(seq 1 90); do
  if mysqladmin --protocol=TCP ping -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USERNAME}" "-p${DB_PASSWORD}" "${mysql_tls_args[@]}" --silent >/dev/null 2>&1; then
    echo "MySQL is ready."
    break
  fi

  if [[ "${attempt}" == "90" ]]; then
    echo "MySQL did not become ready in time."
    exit 1
  fi

  sleep 2
done

MYSQL_CMD=(mysql --protocol=TCP -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USERNAME}" "-p${DB_PASSWORD}" "${mysql_tls_args[@]}" "${DB_DATABASE}")

apply_sql_file() {
  local file_path="$1"

  sed -e '/^CREATE DATABASE IF NOT EXISTS/d' -e '/^USE `.*`;/d' "${file_path}" | "${MYSQL_CMD[@]}"
}

echo "Applying schema SQL files..."
apply_sql_file database/migrations/001_init_tables.sql
apply_sql_file database/migrations/002_ai_analysis_and_quizzes.sql

echo "Checking seed state..."
category_count=$("${MYSQL_CMD[@]}" -Nse "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")
if [[ "${category_count}" == "0" ]]; then
  echo "Seeding base data..."
  apply_sql_file database/migrations/seed_data.sql
else
  echo "Seed data already present; skipping seed_data.sql."
fi

echo "Database bootstrap completed."
