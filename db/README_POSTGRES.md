# PostgreSQL setup & examples

Quick steps to create a Postgres database, run the migration, and example client snippets.

1) Create a DB user and database (PowerShell / psql):

```powershell
psql -U postgres -c "CREATE USER myapp_user WITH PASSWORD 'strongpassword';"
psql -U postgres -c "CREATE DATABASE myapp OWNER myapp_user;"
psql -U postgres -d myapp -c "GRANT ALL PRIVILEGES ON DATABASE myapp TO myapp_user;"
```

2) Run the migration (as the new user):

```powershell
psql -U myapp_user -d myapp -f db/migration.sql
```

3) Set `DATABASE_URL` environment variable (example):

```powershell
$env:DATABASE_URL = "postgresql://myapp_user:strongpassword@localhost:5432/myapp"
```

4) Minimal Node.js example (packages: `pg`, `bcrypt`):

```js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function register(username, email, password) {
  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3)', [username, email, hash]);
}

async function login(username, password) {
  const res = await pool.query('SELECT id, password_hash FROM users WHERE username=$1', [username]);
  if (!res.rows.length) return false;
  return await bcrypt.compare(password, res.rows[0].password_hash);
}
```

5) Minimal Python example (packages: `sqlalchemy`, `argon2-cffi`):

```py
from sqlalchemy import create_engine, text
from argon2 import PasswordHasher
import os

ph = PasswordHasher()
engine = create_engine(os.environ['DATABASE_URL'])

def register(username, email, password):
    hash = ph.hash(password)
    engine.execute(text('INSERT INTO users (username,email,password_hash) VALUES (:u,:e,:p)'), {"u":username,"e":email,"p":hash})

def login(username, password):
    row = engine.execute(text('SELECT password_hash FROM users WHERE username=:u'), {"u":username}).fetchone()
    if not row:
        return False
    try:
        return ph.verify(row.password_hash, password)
    except Exception:
        return False
```

Security notes:
- Never store plaintext passwords.
- Use Argon2 or bcrypt (Argon2 preferred).
- Keep `DATABASE_URL` and credentials out of source control; use environment variables or a secret manager.
- Use parameterized queries (examples use them).
- Enable TLS for remote DB connections and restrict access by IP.

Next steps: I can scaffold a runnable Node.js or Python example in the project. Which do you prefer?
