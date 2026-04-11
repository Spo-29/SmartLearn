#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUN_DB_BOOTSTRAP:-true}" == "true" ]]; then
  echo "Running database bootstrap..."
  /bin/bash /var/www/html/scripts/render-db-init.sh
else
  echo "Skipping database bootstrap because RUN_DB_BOOTSTRAP is not true."
fi

exec apache2-foreground
