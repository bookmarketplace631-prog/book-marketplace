# Railway PostgreSQL Setup Guide

## The Error You're Seeing

```
GET /grades 500 (Internal Server Error)
```

This happens because your Railway deployment **doesn't have the PostgreSQL database credentials set**.

## How to Fix It

### Step 1: Create PostgreSQL Database on Railway

1. Go to your Railway project: https://railway.app/dashboard
2. Click **"Add Service"** → Select **"PostgreSQL"**
3. Wait for it to deploy (2-3 minutes)
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab

### Step 2: Copy PostgreSQL Credentials

You'll see these variables (example values):
```
PGUSER=postgres
PGPASSWORD=abc123xyz...
PGHOST=railway.railway.internal
PGPORT=5432
PGDATABASE=railway
```

### Step 3: Add Environment Variables to Your App Service

1. Go back to your main **Book Marketplace** service
2. Click **"Variables"** tab
3. **Add these environment variables** (map from PGXX to DB_XX):

```
DB_USER=postgres
DB_PASSWORD=abc123xyz...
DB_HOST=railway.railway.internal
DB_PORT=5432
DB_NAME=railway
NODE_ENV=production
```

Or simpler - use the Railway **Link Services** feature:
1. In your main service, click **"Add Plugin"** → **PostgreSQL**
2. It will auto-populate the variables

### Step 4: Verify

1. Redeploy your app (Railway auto-deploys when you add vars)
2. Check the deployment logs
3. Open browser and test: `https://my-book-stationary.up.railway.app/health`
4. Should see: `{"status":"ok","database":"connected"}`

## Common Issues

**Still getting 500 errors?**
- ✅ Check Railway logs for actual error message
- ✅ Verify all DB_XXX variables are set (case-sensitive!)
- ✅ Make sure PostgreSQL service is running
- ✅ Restart your app service

**How to check logs:**
1. Go to your app service in Railway
2. Click **"Deployments"** tab
3. Click the latest deployment
4. Scroll down to see full logs
5. Look for database connection errors

## Testing the Connection

Once variables are set, the `/health` endpoint will tell you if the database is connected:
```
GET https://my-book-stationary.up.railway.app/health
```

Response if working:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-28T12:34:56..."
}
```

Response if not working:
```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "..."
}
```

## Next Steps

Once database is connected and `/health` works:
1. All API endpoints should work
2. Your frontend will communicate with the backend
3. You can start adding books and making orders

Need help? Check Railway docs: https://docs.railway.app/
