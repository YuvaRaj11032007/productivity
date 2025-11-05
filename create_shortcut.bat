@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    Preparation Tracker - Desktop Shortcut Setup
echo ===================================================
echo.

:: Path to the application directory
set APP_DIR=%~dp0

:: Check if the app directory exists and contains package.json
if not exist "%APP_DIR%package.json" (
    echo Error: package.json not found in %APP_DIR%
    echo Please run this script from the application root directory.
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Creating desktop shortcut...

:: Run the VBScript to create the shortcut
cscript //nologo "%APP_DIR%create_shortcut.vbs"

echo.
echo ===================================================
echo Setup complete! A shortcut has been created on your desktop.
echo.
echo To start the application:
echo 1. Double-click the "Preparation Tracker" shortcut on your desktop
echo 2. The application will open in your default browser
echo ===================================================
echo.

pause
endlocal
