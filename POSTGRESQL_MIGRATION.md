# PostgreSQL Migration Guide

## What Changed
Your application has been migrated from **SQLite** to **PostgreSQL**. This is essential for production deployment.

### Key Changes:
1. **Database Module**: sqlite3 → pg
2. **Connection**: File-based → Network-based (perfect for Railway)
3. **Queries**: Callbacks → Async/Await
4. **Data Types**: SQLite types → PostgreSQL types

## Setup Instructions

### 1. On Railway, Create PostgreSQL Database
- Go to your Railway project
- Click "Add Service" → Select "PostgreSQL"
- Copy the connection string

### 2. Set Environment Variables on Railway
In your Railway dashboard, set these variables:
```
DB_USER=postgres
DB_PASSWORD=<your_password>
DB_HOST=<railway_postgres_host>
DB_PORT=5432
DB_NAME=bookmarketplace
NODE_ENV=production
```

### 3. Local Development (Optional)
If you want to test locally:

```bash
# Install PostgreSQL locally
# Create a database called 'bookmarketplace'

# Create .env file in the backend folder:
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookmarketplace
NODE_ENV=development
```

Then run:
```bash
cd backend
npm install
npm start
```

## File Structure
- `db-config.js` - PostgreSQL connection pool and schema initialization
- `server.js` - All routes updated to use PostgreSQL
- `.env.example` - Environment variable template

## Database Features
- ✅ Automatic table creation on startup
- ✅ Connection pooling for performance
- ✅ Parameterized queries (SQL injection safe)
- ✅ Async/await for cleaner code
- ✅ Persistent data across deployments

## Important Notes
1. Your data from SQLite is NOT automatically migrated. Start fresh or manually migrate if needed.
2. Make sure PostgreSQL database is created before deploying.
3. Tables are created automatically on first startup.
4. Use `ON CONFLICT` for INSERT/UPDATE operations (instead of INSERT OR REPLACE).

## Deployment
1. Push changes to GitHub
2. Railway will automatically redeploy
3. Check logs to confirm: "✓ Database tables initialized"
