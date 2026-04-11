#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${MYSQL_SSL_CA_CERT:-}" && -z "${MYSQL_ATTR_SSL_CA:-}" ]]; then
  ca_path="/tmp/mysql-ca.pem"
  # Support both true multiline PEM and escaped \n format from environment variables.
  printf '%b' "${MYSQL_SSL_CA_CERT}" > "${ca_path}"

  if grep -q "BEGIN CERTIFICATE" "${ca_path}" && grep -q "END CERTIFICATE" "${ca_path}"; then
    chmod 600 "${ca_path}"
    export MYSQL_ATTR_SSL_CA="${ca_path}"
    echo "MySQL CA certificate written to ${ca_path}."
  else
    rm -f "${ca_path}"
    echo "MYSQL_SSL_CA_CERT is not valid PEM content; skipping MYSQL_ATTR_SSL_CA."
  fi
fi

if [[ "${RUN_DB_BOOTSTRAP:-true}" == "true" ]]; then
  echo "Starting database bootstrap in background..."
  /bin/bash /var/www/html/scripts/render-db-init.sh &
else
  echo "Skipping database bootstrap because RUN_DB_BOOTSTRAP is not true."
fi

exec apache2-foreground
