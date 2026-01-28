# 500 Error - Database Connection Issue

## Problem

You're getting `500 Internal Server Error` on `/grades` endpoint because the PostgreSQL database isn't connected.

## Root Cause

Your Railway deployment **doesn't have PostgreSQL credentials configured**. The backend can't connect to any database, so all queries fail.

## Quick Fix (5 minutes)

### 1. Go to Railway Dashboard
- https://railway.app/dashboard
- Select your **Book Marketplace** project

### 2. Add PostgreSQL Service
- Click **"Add Service"** 
- Select **"PostgreSQL"**
- Wait 2-3 minutes for it to deploy

### 3. Set Environment Variables

In your **Book Marketplace** app service, click **"Variables"** and add:

```
DB_USER=postgres
DB_PASSWORD=[copy from PostgreSQL service]
DB_HOST=railway.railway.internal  
DB_PORT=5432
DB_NAME=railway  [or your chosen database name]
NODE_ENV=production
```

**How to get PostgreSQL credentials:**
1. Click on PostgreSQL service in Railway
2. Click **"Variables"** tab
3. Copy `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE`
4. Map them to `DB_USER`, `DB_PASSWORD`, etc.

### 4. Redeploy
- Railway automatically redeploys when you add variables
- Check deployment logs for confirmation

## Testing

Once deployed, open browser and visit:
```
https://my-book-stationary.up.railway.app/health
```

**Success response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-28T..."
}
```

**Error response:**
```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "..."
}
```

## Debugging

Check Railway deployment logs:
1. Go to your app service
2. Click **"Deployments"** tab
3. Click latest deployment
4. Look for logs with ✓ or ❌ marks:
   - ✓ `Database connection successful` = Good
   - ❌ `Database connection failed` = Variables not set

## What We Fixed

✅ Added better error logging in `db-config.js`
✅ Shows which environment variables are missing
✅ Created detailed Railway setup guide (RAILWAY_SETUP.md)
✅ App will now tell you exactly what's wrong instead of generic 500 error

## Next Steps

1. Set up PostgreSQL on Railway (follow steps above)
2. Redeploy
3. Test `/health` endpoint
4. All other endpoints will work once database is connected

Need help? Check `RAILWAY_SETUP.md` in your repo for detailed instructions!
