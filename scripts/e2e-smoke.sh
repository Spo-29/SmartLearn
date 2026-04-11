#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:9000}"

echo "Waiting for ${BASE_URL}/api/health..."
for attempt in $(seq 1 60); do
  health_body="$(curl -sS "${BASE_URL}/api/health" || true)"
  health_status="$(printf '%s' "${health_body}" | jq -r '.status // empty' 2>/dev/null || true)"

  if [[ "${health_status}" == "ok" ]]; then
    echo "Service is healthy."
    break
  fi

  if [[ "${attempt}" == "60" ]]; then
    echo "Service did not become healthy in time."
    echo "Last health payload: ${health_body}"
    exit 1
  fi

  sleep 5
done

echo "Checking SPA root page..."
curl --fail --show-error --silent "${BASE_URL}/" >/dev/null

echo "Checking public API categories..."
categories_body="$(curl --fail --show-error --silent "${BASE_URL}/api/categories")"
category_count="$(printf '%s' "${categories_body}" | jq 'length')"
if [[ "${category_count}" -lt 1 ]]; then
  echo "Expected categories to be seeded, got: ${categories_body}"
  exit 1
fi

echo "Registering a unique test user..."
unique_email="ci-user-$(date +%s)@example.com"
register_payload="{\"name\":\"CI Test User\",\"email\":\"${unique_email}\",\"password\":\"password123\"}"
register_body="$(curl --silent --show-error --request POST "${BASE_URL}/api/register" --header "Content-Type: application/json" --header "Accept: application/json" --data "${register_payload}")"
register_status="$(printf '%s' "${register_body}" | jq -r '.status // empty')"
if [[ "${register_status}" != "200" ]]; then
  echo "Register call failed: ${register_body}"
  exit 1
fi

echo "Authenticating test user..."
auth_payload="{\"email\":\"${unique_email}\",\"password\":\"password123\"}"
auth_body="$(curl --silent --show-error --request POST "${BASE_URL}/api/authenticate" --header "Content-Type: application/json" --header "Accept: application/json" --data "${auth_payload}")"
auth_status="$(printf '%s' "${auth_body}" | jq -r '.status // empty')"
auth_token="$(printf '%s' "${auth_body}" | jq -r '.token // empty')"
if [[ "${auth_status}" != "200" || -z "${auth_token}" ]]; then
  echo "Authenticate call failed: ${auth_body}"
  exit 1
fi

echo "Checking protected profile endpoint..."
profile_body="$(curl --silent --show-error "${BASE_URL}/api/account/profile" --header "Accept: application/json" --header "Authorization: Bearer ${auth_token}")"
profile_status="$(printf '%s' "${profile_body}" | jq -r '.status // empty')"
if [[ "${profile_status}" != "200" ]]; then
  echo "Profile call failed: ${profile_body}"
  exit 1
fi

echo "Smoke e2e checks passed."
