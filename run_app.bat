@echo off
setlocal
cd /d "%~dp0"
title Bank Sheet App Launcher

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo ERROR: Node.js is not installed on this computer.
    echo.
    echo This application requires Node.js to run.
    echo Please download and install it from: https://nodejs.org/
    echo ========================================================
    pause
    exit /b
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo First run detected. Installing dependencies...
    echo This may take a few minutes...
    call npm install
)

echo Starting Bank Sheet Application...
echo The browser will open automatically.
echo.
echo Network Access:
echo If you want to use this on your phone/tablet connected to the same WiFi:
echo Look for "Network:" in the output below (e.g., http://192.168.1.5:5173)
echo.

call npm run dev -- --open

pause
