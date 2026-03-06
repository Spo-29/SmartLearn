# SmartLearn Migration Prompt

**Use this prompt at the start of a new chat session to quickly migrate new code from `smartlearn-video` to `smartlearn`.**

---

## Quick Context Prompt (copy-paste this)

```
I'm migrating code from my tutorial project `smartlearn-video` (at e:\xampp\htdocs\smartlearn-video)
into my submission project `smartlearn` (at e:\smartlearn).

## Architecture Differences — READ THIS FIRST

| Aspect | smartlearn-video (source) | smartlearn (target) |
|--------|--------------------------|---------------------|
| Backend framework | Laravel 12.x | Laravel 8.x (^8.75) — DO NOT upgrade |
| Backend folder | `backend/` | `server/` |
| Frontend folder | `frontend/` | `client/` |
| Frontend lang | JSX (no TypeScript) | JSX (was TypeScript, converted to JSX) |
| Routing | Laravel 12 modern (bootstrap/app.php) | Laravel 8 traditional (Kernel.php + Providers) |
| CORS | Built-in Laravel 12 | fruitcake/laravel-cors ^2.0 |
| Auth | Laravel 12 style | laravel/sanctum ^2.11 + laravel/breeze ^1.10 |
| Database | MySQL via XAMPP | MySQL 8.0 via Docker |
| Docker | None | Dockerfile + docker-compose.yml |
| SQL migrations | Laravel PHP migrations in `database/migrations/*.php` | Raw SQL in `database/migrations/*.sql` (auto-run by Docker) |

## File Mapping Rules

### Backend (Laravel)
- Source: `e:\xampp\htdocs\smartlearn-video\backend\`  →  Target: `e:\smartlearn\server\`
- **Models**: Copy model files to `server/app/Models/`. Keep `use HasFactory;` trait.
  Add proper `$fillable` arrays and Eloquent relationships (belongsTo/hasMany).
  The source models are empty scaffolds — fill them based on the migration files.
- **Controllers**: Copy to `server/app/Http/Controllers/`.
  IMPORTANT: Laravel 8 controllers extend `App\Http\Controllers\Controller` (same).
  But route registration differs — use `Route::get('/path', [Controller::class, 'method'])` in `server/routes/api.php`.
- **Routes**: Add API routes to `server/routes/api.php`.
  DO NOT touch `server/routes/auth.php` (Breeze auth routes).
  The web.php has a SPA catch-all: `Route::get('/{any}', ...)` excluding `/api`.
- **Middleware**: Keep existing middleware in `server/app/Http/Middleware/`.
  If new middleware is needed, register it in `server/app/Http/Kernel.php` (Laravel 8 style).
- **Services**: Place in `server/app/Services/`.
- **Database migrations**: Convert Laravel PHP migrations to raw SQL and APPEND to
  `database/migrations/001_init_tables.sql`. Do NOT create new .php migration files.

### Frontend (React)
- Source: `e:\xampp\htdocs\smartlearn-video\frontend\src\`  →  Target: `e:\smartlearn\client\src\`
- **Components**: `client/src/components/common/` (shared) and `client/src/components/pages/` (pages)
- **Account pages**: `client/src/components/pages/account/`
- **Routes**: Add new routes to `client/src/App.jsx` inside the `<Routes>` block
- **Styles**: Append new styles to `client/src/assets/style.scss`
- **Images**: Place in `client/src/assets/images/`
- **API calls**: Use `import.meta.env.VITE_BACKEND_ENDPOINT` as the base URL
  (defined in `client/.env.example` as `VITE_BACKEND_ENDPOINT=http://localhost:8000`)
- **New npm packages**: Add to `client/package.json` dependencies

### Existing npm packages (already in client/package.json):
react 19, react-dom 19, react-router-dom 7, react-bootstrap, bootstrap 5,
sass-embedded, filepond + plugins, jodit-react, react-hook-form, react-hot-toast,
react-icons, react-player, react-simple-star-rating, @hello-pangea/dnd

## Current File Structure in smartlearn

```

smartlearn/
├── docker-compose.yml # Docker orchestration (app + db + phpmyadmin)
├── Dockerfile # PHP 8.2-apache + Node 18, builds client into server/public
├── package.json # Root scripts: start:client, start:server, build:prod
├── database/migrations/
│ ├── 001_init_tables.sql # All CREATE TABLE statements (MySQL)
│ └── seed_data.sql # INSERT seed data
├── server/ # Laravel 8.x backend
│ ├── app/Models/ # Eloquent models with relationships
│ ├── app/Http/Controllers/ # API controllers
│ ├── app/Http/Kernel.php # Middleware registration (Laravel 8)
│ ├── app/Http/Middleware/ # Auth, CORS, etc.
│ ├── app/Providers/ # Service providers (Laravel 8)
│ ├── routes/api.php # API routes
│ ├── routes/auth.php # Breeze auth routes
│ ├── routes/web.php # SPA catch-all
│ ├── config/ # Laravel config files
│ └── composer.json # Laravel 8 deps (DO NOT change versions)
├── client/ # React 19 + Vite frontend
│ ├── src/App.jsx # All routes
│ ├── src/main.jsx # Entry point (bootstrap + scss imports)
│ ├── src/assets/style.scss # All custom styles
│ ├── src/assets/images/ # Static images
│ ├── src/components/common/ # Shared components (Header, Footer, Layout, etc.)
│ ├── src/components/pages/ # Page components
│ └── src/components/pages/account/ # Account-related pages
│ ├── package.json # React deps
│ └── vite.config.js # Vite config (port 5173)

```

## Existing Models (server/app/Models/):
User, Course, Category, Chapter, Lesson, Enrollment, Language, Level,
Outcome, Requirement, Review, Activity

## Existing API Routes (server/routes/api.php):
GET /api/user (auth:sanctum), GET /api/categories, GET /api/languages,
GET /api/levels, GET /api/courses, GET /api/courses/featured, GET /api/courses/{id}

## Existing Frontend Routes (client/src/App.jsx):
/, /courses, /detail, /account/login, /account/register, /account/my-courses,
/account/courses-enrolled, /account/watch-course, /account/change-password

## Existing Frontend Components:
Common: Course, FeaturedCategories, FeaturedCourses, Footer, Header, Hero, Layout
Pages: Home, Courses, Detail, Login, Register
Account: ChangePassword, CoursesEnrolled, MyCourses, WatchCourse

## How to Run Locally (without Docker):
- Backend: `cd server && php artisan serve` (needs PHP + MySQL running)
- Frontend: `cd client && npm install && npm run dev`
- Or from root: `npm run start:client` / `npm run start:server`

## How to Run with Docker:
- `docker-compose up --build`
- App: http://localhost:8000, phpMyAdmin: http://localhost:8080

---

## MIGRATION TASK:
[Describe what new code you added in smartlearn-video here, e.g.:]
- "I added a new CourseController with CRUD methods"
- "I created a new Dashboard page component"
- "I added new migration for payments table"

Please migrate these changes following the mapping rules above.
```

---

## Step-by-Step Migration Checklist

When migrating new features from `smartlearn-video` to `smartlearn`:

### 1. Database Changes

- [ ] Read new Laravel migration files in `smartlearn-video/backend/database/migrations/`
- [ ] Convert to raw SQL `CREATE TABLE` / `ALTER TABLE` statements
- [ ] Append to `smartlearn/database/migrations/001_init_tables.sql`
- [ ] Add seed data to `smartlearn/database/migrations/seed_data.sql` if needed

### 2. Backend Models

- [ ] Copy new/updated models from `backend/app/Models/` to `server/app/Models/`
- [ ] Ensure `$fillable` arrays are complete (source models are often empty scaffolds)
- [ ] Add Eloquent relationships based on foreign keys in migrations

### 3. Backend Controllers

- [ ] Copy controllers from `backend/app/Http/Controllers/` to `server/app/Http/Controllers/`
- [ ] Verify imports work with Laravel 8 namespace style

### 4. Backend Routes

- [ ] Add new routes to `server/routes/api.php`
- [ ] Use Laravel 8 syntax: `Route::get('/path', [Controller::class, 'method'])`

### 5. Frontend Components

- [ ] Copy/create components in `client/src/components/`
- [ ] Follow existing structure: `common/` for shared, `pages/` for routes, `pages/account/` for auth pages

### 6. Frontend Routes

- [ ] Add new `<Route>` entries to `client/src/App.jsx`
- [ ] Add corresponding imports at the top of the file

### 7. Styles

- [ ] Append new SCSS to `client/src/assets/style.scss`

### 8. New Dependencies

- [ ] Add new npm packages to `client/package.json` (then `npm install`)
- [ ] Add new composer packages to `server/composer.json` if needed (then `composer install`)
