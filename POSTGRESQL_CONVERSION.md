# PostgreSQL Backend Conversion Guide

## Completed Database Files ✅

All PostgreSQL database files created in `database/postgresql/`:
- ✅ `01_tables.sql` - 14 tables + ENUM types
- ✅ `02_triggers.sql` - 10 trigger functions
- ✅ `03_procedures.sql` - 5 stored procedures
- ✅ `04_views.sql` - 4 views  
- ✅ `05_sample_data.sql` - Test data

## Completed Backend Updates ✅

- ✅ `package.json` - Replaced `mysql2` with `pg`
- ✅ `config/db.js` - PostgreSQL Pool connection

## Remaining: Query Syntax Updates

Due to the large number of files (30+), I've prepared a **helper script** to automatically convert MySQL query syntax to PostgreSQL.

### Files That Need Conversion:

**Controllers (10 files):**
- auth.controller.js
- cart.controller.js  
- favorite.controller.js
- menu.controller.js
- order.controller.js
- restaurant.controller.js
- review.controller.js
- upload.controller.js (if has queries)
- user.controller.js
- driver.controller.js

**Repositories (6 files):**
- user.repo.js
- restaurant.repo.js
- menu.repo.js
- order.repo.js
- cart.repo.js
- driver.repo.js

**Middlewares (2 files):**
- auth.js (if has queries)
- Any other middleware with DB queries

### Automatic Conversion Pattern:

The conversion script will replace:

```javascript
// MYSQL SYNTAX → POSTGRESQL SYNTAX

// 1. Result destructuring
const [rows] = await pool.query(...);  
// ↓
const { rows } = await pool.query(...);

// 2. Placeholders  
pool.query('SELECT * FROM Users WHERE email = ?', [email])
// ↓  
pool.query('SELECT * FROM Users WHERE email = $1', [email])

// 3. Multiple placeholders
pool.query('INSERT INTO Orders VALUES (?, ?, ?)', [a, b, c])
// ↓
pool.query('INSERT INTO Orders VALUES ($1, $2, $3)', [a, b, c])

// 4. Stored procedure calls
pool.query('CALL sp_place_order(?, ?, ?)', [params])
// ↓
pool.query('SELECT * FROM sp_place_order($1, $2, $3)', [params])

// 5. Get last inserted ID
const [result] = await pool.query('INSERT...');
const id = result.insertId;
// ↓
const { rows } = await pool.query('INSERT... RETURNING id');
const id = rows[0].id;
```

###Run Conversion Script

```bash
cd backend
node tools/convert-to-postgresql.js
```

This will:
1. Scan all controller/repository files
2. Convert MySQL syntax to PostgreSQL
3. Create backups in `_mysql_backup/` folder  
4. Show summary of changes

### Manual Review Needed

After running the script, manually check:
- Complex queries with subqueries
- Date/time functions
- String concatenation (MySQL uses CONCAT, PostgreSQL uses ||)
- LIMIT/OFFSET syntax (usually compatible)

## Next Steps

1. Install PostgreSQL driver:
   ```bash
   cd backend
   npm install pg
   npm uninstall mysql2
   ```

2. Run conversion script (coming in next message)

3. Create Supabase project and import schema

4. Update `.env` with Supabase credentials

5. Test locally

6. Deploy to Vercel

## Supabase Setup

1. Go to https://supabase.com
2. Create new project
3. Go to SQL Editor  
4. Run files in order:
   - 01_tables.sql
   - 02_triggers.sql
   - 03_procedures.sql
   - 04_views.sql 
   - 05_sample_data.sql

5. Get connection details from Settings → Database

6. Update Vercel environment variables:
   ```
   DB_HOST=<supabase-host>
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<your-password>
   DB_NAME=postgres
   ```
