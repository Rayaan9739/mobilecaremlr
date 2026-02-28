@echo off
echo Starting Mobile Care Backend Server...
echo.
cd /d "%~dp0mc_backend"
echo Current directory: %CD%
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting server...
call npm run dev
