# B-Safe

B-Safe is a Laravel application with a React and Inertia frontend.

## Requirements

- PHP 8.3 or later with the extensions required by Laravel, including `pdo_pgsql` when using Supabase PostgreSQL
- Composer
- Node.js and npm
- A Supabase project (or another PostgreSQL database) for PostgreSQL development

## Setup after cloning

Run these commands from the project directory:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
npm ci
```

Edit `.env` and configure the database before migrating. For the Supabase
transaction pooler, use the connection values shown in your Supabase project's
Connect panel. Keep credentials private and do not commit `.env`.

```dotenv
DB_CONNECTION=pgsql
DB_HOST=<your-supabase-pooler-host>
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.<your-project-ref>
DB_PASSWORD=<your-database-password>
DB_SCHEMA=public
```

The PostgreSQL connection uses SSL. `DB_SCHEMA` defaults to `public`; make sure
the schema exists and the database user has permission to create tables there.

Run the database migrations:

```powershell
php artisan migrate
```

Start the application and frontend development server. Run each command in its
own terminal:

```powershell
php artisan serve
```

```powershell
npm run dev
```

Open the URL printed by `php artisan serve` in your browser.

## Useful commands

```powershell
php artisan test
npm run check
npm run types:check
npm run build
```

If you change database settings after Laravel has cached configuration, clear
the cache and retry:

```powershell
php artisan config:clear
php artisan migrate
```

Do not use `migrate:fresh` against a shared or production database; it drops
existing tables and data.
