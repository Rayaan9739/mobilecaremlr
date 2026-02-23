@echo off
echo ========================================
echo  Mobile Care - Database Setup Script
echo ========================================
echo.

echo Step 1: Pushing schema to database...
call npx prisma db push --accept-data-loss
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push schema to database
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS! Database is ready.
echo ========================================
echo.
echo Next steps:
echo 1. Restart your backend server (npm run dev)
echo 2. Refresh your frontend browser
echo.
pause
