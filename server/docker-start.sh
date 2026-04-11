#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${MYSQL_SSL_CA_CERT:-}" && -z "${MYSQL_ATTR_SSL_CA:-}" ]]; then
  ca_path="/tmp/mysql-ca.pem"
  printf '%s\n' "${MYSQL_SSL_CA_CERT}" > "${ca_path}"
  chmod 600 "${ca_path}"
  export MYSQL_ATTR_SSL_CA="${ca_path}"
  echo "MySQL CA certificate written to ${ca_path}."
fi

if [[ "${RUN_DB_BOOTSTRAP:-true}" == "true" ]]; then
  echo "Starting database bootstrap in background..."
  /bin/bash /var/www/html/scripts/render-db-init.sh &
else
  echo "Skipping database bootstrap because RUN_DB_BOOTSTRAP is not true."
fi

exec apache2-foreground
