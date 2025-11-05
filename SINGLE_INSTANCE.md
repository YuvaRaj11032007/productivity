# Single Instance Mechanism for Preparation Tracker

## Overview

This document explains the single-instance mechanism implemented in the Preparation Tracker app. The mechanism ensures that only one instance of the app can run at a time, preventing duplicate tabs and processes.

## How It Works

The single-instance mechanism consists of several components working together:

1. **single-instance.js**: A Node.js script that checks if the app is already running by:
   - Attempting to connect to the app's port (3000)
   - Using a lock file to track running instances
   - Providing an API for other scripts to use

2. **singleInstanceWrapper.js**: A wrapper script that:
   - Integrates with npm start
   - Checks for existing instances before starting the app
   - Handles process management and cleanup

3. **start_app.bat**: A batch script that:
   - Uses single-instance.js to check for existing instances
   - Starts the React development server if no instance is running
   - Opens the browser only once

4. **create_shortcut.vbs**: A VBScript that:
   - Creates a desktop shortcut
   - Generates a start_app.bat file with single-instance checks

## Technical Details

### Lock File

The mechanism uses a lock file (.app-lock) to track running instances. The lock file contains:
- A timestamp of when the instance started
- The process ID (PID) of the running instance

The lock file is automatically removed when the app exits normally. If the app crashes, the lock file becomes stale after 30 seconds, allowing a new instance to start.

### Port Checking

The mechanism attempts to connect to port 3000 to check if the app is already running. If a connection is successful, it means the app is running and a new instance should not be started.

### Process Management

The mechanism handles process management by:
- Starting the React development server in a minimized window
- Opening the browser only once
- Ensuring proper cleanup when the app exits

## Usage

### Starting the App

You can start the app using any of these methods:

1. **Desktop Shortcut**: Double-click the "Preparation Tracker" shortcut on your desktop
2. **npm start**: Run `npm start` in the project directory
3. **start_app.bat**: Run the start_app.bat script directly

All of these methods will check if the app is already running and prevent duplicate instances.

### Development

If you need to bypass the single-instance check for development purposes, you can use:

```bash
npm run start:direct
```

This will start the app directly using react-scripts, without the single-instance check.

## Troubleshooting

If you encounter issues with the single-instance mechanism:

1. **App won't start**: Check if there's a stale lock file (.app-lock) in the project directory and delete it
2. **Multiple instances still running**: Make sure you're using the provided start methods and not bypassing the mechanism
3. **Browser doesn't open**: The mechanism might be detecting an existing instance. Check your browser tabs for the app

## Files

- **single-instance.js**: The core single-instance mechanism
- **src/singleInstanceWrapper.js**: Wrapper for npm start
- **start_app.bat**: Batch script for starting the app
- **create_shortcut.vbs**: Script for creating the desktop shortcut