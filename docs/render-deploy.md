# SmartLearn Free Deployment Guide (Render + Aiven + GitHub Actions)

This guide uses a decoupled architecture to avoid paid Render database services:

- Render Free Web Service for the Docker app (Laravel API + built React SPA)
- External MySQL provider (Aiven recommended)
- GitHub Actions for CI + deploy hook trigger

## 1. Why Render asked for a credit card

Render free tier covers stateless web compute. Render-managed MySQL requires a private service and persistent disk, which is paid. If your `render.yaml` contains a MySQL private service, billing is required.

In this repo, deployment is now app-only on Render, with database hosted externally.

## 2. What changed in this repo

- `render.yaml` now defines only `smartlearn-app` (no Render MySQL service, no Render disk)
- `render.yaml` DB variables are external (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`)
- `scripts/render-db-init.sh` now supports external DB names and optional TLS settings
- `.github/workflows/ci-e2e.yml` still uses Docker Compose for CI with a temporary MySQL container (independent from production)

## 3. Aiven setup (recommended)

1. Create an Aiven account and create a MySQL service on the free plan (if available in your account/region).
2. Create a database for SmartLearn (example: `smartlearn`).
3. Create a DB user with read/write permissions on that database.
4. Copy these connection values from Aiven:
   - Host
   - Port
   - Database name
   - Username
   - Password
5. Keep TLS enabled. For this repo, use `MYSQL_SSL_MODE=REQUIRED` on Render.

### Aiven connection test from terminal

After installing MySQL client, test with:

```bash
mysql --user <username> --password=<password> --host <host> --port <port> <database>
```

Example format from Aiven instructions:

```bash
mysql --user avnadmin --password=<password> --host mysql-xxxxx.aivencloud.com --port 14259 defaultdb
```

Then run:

```sql
select 1 + 2 as three;
```

Expected output includes `3`.

## 4. Render setup (app only)

1. Push `main` to GitHub.
2. In Render Dashboard, create a Blueprint from this repo.
3. Confirm there is only one service:
   - `smartlearn-app` (web, docker, free plan)
4. Set environment variables for `smartlearn-app`:

Required app values:

- `APP_NAME=SmartLearn`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generated key>`
- `APP_URL=https://<your-render-web-url>.onrender.com`
- `FRONTEND_URL=https://<your-render-web-url>.onrender.com`
- `LOG_LEVEL=error`
- `VITE_BACKEND_ENDPOINT=` (leave empty for same-origin `/api`)

Required external DB values from Aiven:

- `DB_CONNECTION=mysql`
- `DB_HOST=<aiven-host>`
- `DB_PORT=<aiven-port>`
- `DB_DATABASE=<aiven-database>`
- `DB_USERNAME=<aiven-username>`
- `DB_PASSWORD=<aiven-password>`
- `MYSQL_SSL_MODE=REQUIRED`

If you use Aiven defaults, this is often:

- `DB_DATABASE=defaultdb`
- `DB_USERNAME=avnadmin`

Optional values:

- `MYSQL_ATTR_SSL_CA` (path in container if you bundle a CA file)
- `GEMINI_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Generate `APP_KEY` locally:

```bash
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

## 5. GitHub setup

### Required repository secret

- `RENDER_DEPLOY_HOOK_URL` (Render web service deploy hook)

### CI secret requirements

No app secrets are required for CI in this repo.

Reason:

- CI creates `server/.env` from `server/.env.example` at runtime
- CI generates `APP_KEY` dynamically
- CI runs against Docker Compose services on the runner, not your Render/Aiven production resources

### Optional GitHub Environments

Use GitHub Environments only if you want approval gates or environment-scoped secrets. If used, store `RENDER_DEPLOY_HOOK_URL` there and update workflow environment settings.

## 6. CI/CD flow

1. `CI E2E` runs on pull requests, push to `main`, and manual dispatch.
2. CI starts Docker Compose (app + temporary MySQL) on GitHub runner.
3. Smoke checks validate:
   - `/api/health`
   - `/api/categories`
   - register
   - authenticate
   - protected profile route
4. If CI succeeds on `main`, `Deploy Render` triggers the Render deploy hook.

## 7. Render pre-deploy database bootstrap

Before app start, Render runs:

```bash
bash scripts/render-db-init.sh
```

The script now:

- waits for external MySQL readiness
- applies schema SQL files
- seeds base data only when categories are empty
- supports optional TLS flags (`MYSQL_SSL_MODE`, `MYSQL_ATTR_SSL_CA`, `MYSQL_SSL_CERT`, `MYSQL_SSL_KEY`)

## 8. Post-deploy verification checklist

1. Open `https://<your-render-web-url>.onrender.com/api/health`
2. Confirm response contains `{"status":"ok"}`
3. Open `https://<your-render-web-url>.onrender.com/api/categories`
4. Confirm category data is returned
5. Open app root URL and test register/login

## 9. Common issues

### Health endpoint fails right after deploy

- Verify all DB env vars match Aiven exactly.
- Confirm Aiven allows public access from Render.
- Check pre-deploy logs for `scripts/render-db-init.sh`.

### TLS/SSL DB connection errors

- Keep `MYSQL_SSL_MODE=REQUIRED`.
- If your provider enforces CA validation, add a CA file in image and set `MYSQL_ATTR_SSL_CA`.

### API works locally but fails on Render

- Verify `APP_URL` and `FRONTEND_URL` exactly match deployed URL.
- Redeploy after env var changes.

### Wrong frontend API host

- Keep `VITE_BACKEND_ENDPOINT` empty on Render for same-origin requests.
- Trigger rebuild/redeploy after any frontend env change.
