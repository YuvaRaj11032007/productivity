# Preparation Tracker

A comprehensive study progress tracking application to help you manage your study goals, track your progress, and visualize your achievements.

## 🚀 Features

- **Subject Management**: Create, edit, and organize your study subjects
- **Study Timer**: Track your study sessions with a built-in timer
- **Goal Setting**: Set daily, weekly, and monthly study goals
- **Progress Visualization**: View your progress with interactive charts and statistics
- **Calendar View**: See your study sessions on a calendar
- **Dark Mode**: Toggle between light and dark themes
- **Single Instance**: App ensures only one instance runs at a time, preventing duplicate tabs

## 📋 Prerequisites

- Node.js (version 16.x or higher)
- npm (version 8.x or higher)

## 🔧 Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## 🚀 Getting Started

### Running the Application

To start the application, run:

```bash
npm start
```

This will launch the app in development mode and open it in your browser. The app uses a single-instance mechanism to ensure only one instance runs at a time.

If the app is already running, the command will detect it and focus the existing browser tab instead of opening a new one.

For development purposes, if you need to bypass the single-instance check, you can use:

```bash
npm run start:direct
```

### Creating a Desktop Shortcut

For easy access, you can create a desktop shortcut:

1. Double-click the `create_shortcut.bat` file in the project root directory
2. Follow the on-screen instructions
3. A shortcut will be created on your desktop
4. Double-click the shortcut to launch the application

## 🔍 Troubleshooting

If you encounter any issues:

### Package Version Conflicts

If you see errors related to incompatible package versions:

```bash
npm install --force
```

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
set PORT=3001 && npm start
```

### Browser Not Opening Automatically

If the browser doesn't open automatically, manually navigate to:
[http://localhost:3000](http://localhost:3000)

### Multiple Instances or Tabs

The app is designed to run as a single instance. If you're experiencing issues with multiple tabs:

1. Close all browser tabs with the app
2. Delete the `.app-lock` file in the project directory if it exists
3. Restart the app using the desktop shortcut or `npm start`

For more details on the single-instance mechanism, see [SINGLE_INSTANCE.md](./SINGLE_INSTANCE.md)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- React.js
- Material-UI
- Chart.js
- date-fns
