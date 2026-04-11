# SmartLearn Render + GitHub Actions Setup Guide

This project deploys as:

- One Docker web service: Laravel API + built React SPA
- One MySQL private service on Render with persistent disk

## 1. Key answer: where to put env values?

### For GitHub Actions CI

You do not need to upload your full `.env` file to GitHub for CI in this repo.

Reason:

- The CI workflow creates `server/.env` from `server/.env.example` at runtime.
- CI generates `APP_KEY` on the fly.
- CI smoke tests do not call Gemini endpoints.

So for CI, no app secrets are required.

### For Render deployment

Yes, set app and secret environment values in Render Dashboard (or Blueprint prompts). Render is the runtime, so production config belongs there.

### For GitHub deployment trigger

GitHub needs only one secret for deployment automation:

- `RENDER_DEPLOY_HOOK_URL`

## 2. Files added for deployment and CI

- `render.yaml`
- `.github/workflows/ci-e2e.yml`
- `.github/workflows/deploy-render.yml`
- `scripts/render-db-init.sh`
- `scripts/e2e-smoke.sh`
- `server/routes/api.php` includes `GET /api/health`

## 3. Render setup (first-time)

1. Push your branch to GitHub.
2. In Render Dashboard, create a Blueprint from this repo.
3. Confirm services:
   - `smartlearn-mysql` (private service, MySQL 8)
   - `smartlearn-app` (Docker web service)
4. Provide secret values when prompted:
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
   - `APP_KEY`
   - `APP_URL`
   - `FRONTEND_URL`
   - `GEMINI_API_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

## 4. Recommended production values

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://<your-render-web-url>.onrender.com`
- `FRONTEND_URL=https://<your-render-web-url>.onrender.com`

Generate `APP_KEY` locally:

```bash
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

Notes:

- Keep `DB_DATABASE=smartlearn` unless you also edit SQL files under `database/migrations`.
- `VITE_BACKEND_ENDPOINT` is intentionally empty in `render.yaml` for same-origin `/api/...` calls.

## 5. GitHub settings to configure

### Required repository secret

- `RENDER_DEPLOY_HOOK_URL`: your Render web service deploy hook URL

### Optional: GitHub Environments

Not required for current setup.

Use environments only if you want extra controls such as:

- manual approval before production deploy
- branch restrictions
- environment-scoped secrets

If you do use it, store `RENDER_DEPLOY_HOOK_URL` in that environment and update workflow `environment:` settings.

## 6. CI/CD flow in this repo

1. `CI E2E` runs on PRs, push to `main`, and manual dispatch.
2. It builds and starts full Docker stack.
3. It runs smoke e2e checks:
   - `/api/health`
   - `/api/categories`
   - register user
   - authenticate
   - access protected profile endpoint
4. If CI on `main` succeeds, `Deploy Render` workflow calls deploy hook.

## 7. What pre-deploy does on Render

Before app start, Render runs:

```bash
bash scripts/render-db-init.sh
```

That script:

- waits for MySQL readiness
- applies SQL schema files
- seeds data only if categories table is empty

## 8. Post-deploy verification checklist

After first successful deploy:

1. Open `https://<your-render-web-url>.onrender.com/api/health`
2. Ensure response is `{"status":"ok"}`
3. Open `https://<your-render-web-url>.onrender.com/api/categories`
4. Verify category list is returned
5. Open app root URL and test register/login

## 9. Common issues

### App is up but API calls fail

- Verify `APP_URL` and `FRONTEND_URL` exactly match deployed URL.
- Redeploy after env changes.

### DB tables missing

- Check app pre-deploy logs for `scripts/render-db-init.sh` output.

### Frontend using wrong API host

- Keep `VITE_BACKEND_ENDPOINT` empty in Render for same-origin calls.
- Trigger rebuild/redeploy after changing it.
