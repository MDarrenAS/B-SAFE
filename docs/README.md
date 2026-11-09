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
DB_EMULATE_PREPARES=true
```

The PostgreSQL connection uses SSL. `DB_SCHEMA` defaults to `public`; make sure
the schema exists and the database user has permission to create tables there.
`DB_EMULATE_PREPARES=true` is required for Supabase's shared transaction pooler
on port 6543, which does not support prepared statements. Leave it false for
direct or session-mode connections.

### Bootstrap the B-SAFE schema

The application depends on the simulated source tables defined in
[`01_schema.sql`](./01_schema.sql). Apply that SQL to the same PostgreSQL
database using an authorized database administrator before running Laravel
migrations. Review its row-level-security statements and permissions for your
environment first.

The SQL file defines schema only; it does not insert sample records. It
represents simulated Dukcapil, Kemnaker, DJP, and BPJS data and is not a
production integration with those agencies.

After the source schema is present, create the application workflow tables:

```powershell
php artisan migrate
```

The fraud detection rules and risk scoring do not assume policy thresholds or
status mappings. Configure approved values in the private `.env` file before
running detection:

- `BSAFE_PDUK_THRESHOLD`
- `BSAFE_WAGE_GAP_THRESHOLD`
- `BSAFE_COMPANY_WAGE_GAP_THRESHOLD`
- `BSAFE_EMPLOYMENT_STATUS_MAP` (JSON containing `kemnaker_to_bpjs` and `djp_to_bpjs` mappings)
- `BSAFE_RISK_SCORING_METHOD=weighted_sum`
- `BSAFE_RISK_WEIGHTS` (approved JSON weights keyed by anomaly type)
- `BSAFE_RISK_THRESHOLDS` (approved JSON with `medium_min` and `high_min`)

Detection fails explicitly when required settings are missing or invalid. Once
the database contains the source data, the queue worker must also be running to
process a detection run:

```powershell
php artisan bsafe:detect 2025-01
php artisan queue:work
```

Replace the example period with an approved reporting period. Do not copy
example thresholds or mappings from another environment.

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
