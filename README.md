# smart-server
the server that use for integration with client and 3 parties
# Directory Structure

│── package.json           # Manages project dependencies and scripts
│── package-lock.json      # Locks dependencies for consistency
│── jsconfig.json          # JavaScript configuration file
│── .gitignore             # Specifies ignored files for version control
│── .vscode/               # VS Code configurations
│   └── launch.json        # Debugging settings
│── README.md              # Project documentation
│── server.js              # Main entry point of the application
│
├── node_modules/          # Installed dependencies (auto-generated)
│
├── logs/                  # Stores log files
│   ├── combined.log       # General application logs
│   └── error.log          # Error logs
│
├── src/                   # Main source code
│   ├── lib/               # Core logic and modules
│   │   ├── errorHandler.js  # Global error management
│   │   ├── index.js        # Main logic file.
│   │   ├── router.js       # Defines server routes
│   │
│   ├── utils/             # Utility functions
│   │   └── logger.js      # Manages logging functionality
│
├── config/                # Configuration files (e.g., environment variables, DB settings)
│
├── public/                # Static files (HTML, CSS, JS, images)
│
├── routes/                # API route definitions
│
├── controllers/           # Business logic for API requests
│
├── middlewares/           # Middleware functions (authentication, error handling)
│
└── models/                # Database models and schemas