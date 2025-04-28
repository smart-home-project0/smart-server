# smart-server
the server that use for integration with client and 3 parties.

# Two important points
1. class appError - When you want to return an error, return it in this format:
throw new AppError( message, error status)
2. createResponse - When you want to return a response, return it in this format:
res.status(200).json(createRespons(message,data))
These 2 files are under the lib folder


# Directory Structure

│── README.md              # Project documentation
|
│── .vscode/               # VS Code configurations
│   └── launch.json        # Debugging settings
|
├── node_modules/          # Installed dependencies (auto-generated)
│
├── logs/                  # Stores log files
│   ├── combined.log       # General application logs
│   └── error.log          # Error logs
│
├── src/                   # Main source code
│   ├── lib/               # Core logic and modules
|   │   ├── utils/             # Utility functions
│   |   │   └── logger.js      # Manages logging functionality
│   │   ├── errorHandler.js  # Global error management
│   │   ├── appError.js      # Returning a uniform generic error
│   │   ├── response.js  # Returning a uniform generic answer
│   │   ├── router.js       # Defines server routes
|   |   |   ├── user.js     # All user-related functions
│   │   ├── storage/
│   │   |   ├── mongo.js   # Connecting to Mongo DB
|   |   ├── schemas/       # Database models and schemas
│
├── config/                # Configuration files (e.g., environment variables, )
│
│── server.js              # Main entry point of the application-first connection
|                            to DB and server port    
|                                   
│── package.json           # Manages project dependencies and scripts
│── package-lock.json      # Locks dependencies for consistency
│── jsconfig.json          # JavaScript configuration file
│── .gitignore             # Specifies ignored files for version control



