/**
 * Single Instance Wrapper for React App
 * 
 * This script ensures only one instance of the app runs at a time by:
 * 1. Checking if the app is already running
 * 2. If running, focusing the existing browser tab
 * 3. If not running, starting the app and creating a lock file
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

// Configuration
const PORT = process.env.PORT || 3000;
const LOCK_FILE = path.join(process.cwd(), '.app-lock');
const APP_URL = `http://localhost:${PORT}`;

// Flag to prevent multiple instances
let isStarting = false;

/**
 * Check if the app is already running by attempting to connect to its port
 * @returns {Promise<boolean>} True if the app is running, false otherwise
 */
async function isAppRunning() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    
    client.setTimeout(2000);
    
    client.on('connect', () => {
      client.destroy();
      resolve(true);
    });
    
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
    
    client.on('error', () => {
      client.destroy();
      resolve(false);
    });
    
    client.connect(PORT, '127.0.0.1');
  });
}

/**
 * Check if the lock file exists and is valid
 * @returns {boolean} True if a valid lock file exists, false otherwise
 */
function checkLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      const now = Date.now();
      
      // Check if the lock file is stale (older than 60 seconds)
      if (now - lockData.timestamp > 60000) {
        console.log('Stale lock file found. Removing...');
        fs.unlinkSync(LOCK_FILE);
        return false;
      }
      
      // Check if the process is still running
      try {
        process.kill(lockData.pid, 0); // This doesn't actually kill the process, just checks if it exists
        return true;
      } catch (e) {
        // Process doesn't exist
        console.log('Lock file references a non-existent process. Removing...');
        fs.unlinkSync(LOCK_FILE);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking lock file:', error);
    return false;
  }
}

/**
 * Create a lock file with the current process ID and timestamp
 */
function createLockFile() {
  try {
    const lockData = {
      pid: process.pid,
      timestamp: Date.now()
    };
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData));
    
    // Remove the lock file when the process exits
    process.on('exit', () => {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (error) {
        console.error('Error removing lock file:', error);
      }
    });
    
    // Handle signals to ensure lock file is removed
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        try {
          if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
          }
        } catch (error) {
          console.error(`Error removing lock file on ${signal}:`, error);
        }
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error creating lock file:', error);
  }
}

/**
 * Open the browser to the app URL
 */
function openBrowser() {
  const command = process.platform === 'win32' ? 'start' : 
                 process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  const args = process.platform === 'win32' ? ['""', `"${APP_URL}"`] : [APP_URL];
  
  spawn(command, args, {
    shell: true,
    detached: true,
    stdio: 'ignore'
  }).unref();
}

/**
 * Start the React app using react-scripts
 */
function startReactApp() {
  if (isStarting) {
    console.log('App is already starting...');
    return;
  }
  
  isStarting = true;
  console.log('Starting React app...');
  
  // Create the lock file
  createLockFile();
  
  // Start the React app
  const reactProcess = spawn('npm', ['run', 'start:direct'], {
    shell: true,
    stdio: 'inherit'
  });
  
  // Wait for the app to start before opening the browser
  let appStarted = false;
  let checkCount = 0;
  const maxChecks = 30; // Maximum 30 seconds
  
  const checkInterval = setInterval(async () => {
    checkCount++;
    if (await isAppRunning()) {
      clearInterval(checkInterval);
      if (!appStarted) {
        appStarted = true;
        console.log('App started. Opening browser...');
        setTimeout(() => openBrowser(), 500); // Wait 0.5 seconds before opening browser
      }
    } else if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      if (!appStarted) {
        console.log('Timed out waiting for app to start. Please open the browser manually.');
      }
    }
  }, 500);
  
  reactProcess.on('close', (code) => {
    console.log(`React app process exited with code ${code}`);
    clearInterval(checkInterval);
    isStarting = false;
    
    // Remove the lock file
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
      }
    } catch (error) {
      console.error('Error removing lock file:', error);
    }
    
    process.exit(code);
  });

  reactProcess.on('error', (error) => {
    console.error('Error starting React app:', error);
    isStarting = false;
    clearInterval(checkInterval);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Checking if app is already running...');
  
  // Check if the app is already running
  const running = await isAppRunning();
  const lockExists = checkLockFile();
  
  if (running) {
    console.log('App is already running. Opening browser to existing instance...');
    openBrowser();
    process.exit(0);
  } else if (lockExists) {
    console.log('Another instance is starting. Please wait or open browser manually.');
    openBrowser();
    process.exit(0);
  } else {
    startReactApp();
  }
}

// Prevent multiple executions
if (!global.mainExecuted) {
  global.mainExecuted = true;
  
  // Run the main function
  main().catch(error => {
    console.error('Error:', error);
    isStarting = false;
    process.exit(1);
  });
}