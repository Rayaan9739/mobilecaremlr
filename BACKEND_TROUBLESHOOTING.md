# Backend Server Not Starting - Troubleshooting Guide

## The Problem
You're getting `ERR_CONNECTION_REFUSED` which means the backend server at http://localhost:5000 is NOT running.

## Solution - Start the Backend Server

### Step 1: Open a NEW Terminal/Command Prompt
- Press `Windows + R`
- Type `cmd` and press Enter

### Step 2: Navigate to Backend Folder
```bash
cd "d:\mobile care\mc_backend"
```

### Step 3: Install Dependencies (if first time)
```bash
npm install
```

### Step 4: Start the Server
```bash
npm run dev
```

### Step 5: Wait for Success Messages
You should see:
```
✅ Database connected successfully
🚀 API server listening on port 5000
```

### Step 6: Keep Terminal Open
⚠️ DO NOT CLOSE THIS TERMINAL WINDOW
The backend must keep running while you use the app.

## Common Issues

### Issue 1: Port 5000 Already in Use
**Error:** `Port 5000 already in use`

**Solution:**
1. Find what's using port 5000:
```bash
netstat -ano | findstr :5000
```
2. Kill that process or use a different port

### Issue 2: Module Not Found
**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
npm install
```

### Issue 3: Cloudinary Error
**Error:** `Cannot read properties of undefined (reading 'uploader')`

**Solution:** Already fixed in the code. Just restart:
```bash
npm run dev
```

### Issue 4: Database Connection Failed
**Error:** `Database connection failed`

**Solution:** Check your .env file has correct DATABASE_URL

## Quick Test
Once server is running, open browser and go to:
http://localhost:5000/health

You should see:
```json
{
  "status": "OK",
  "database": "Connected"
}
```

## Still Not Working?

1. Check if Node.js is installed:
```bash
node --version
```

2. Check if you're in the right folder:
```bash
cd "d:\mobile care\mc_backend"
dir
```
You should see: package.json, src folder, etc.

3. Check the terminal for error messages and share them

## Remember
- Backend must be running BEFORE you use the frontend
- Keep the terminal window open
- If you close it, you need to start it again
