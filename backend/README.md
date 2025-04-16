# Backend

This directory hosts the Node.js and TypeScript backend application for IncrGraph. It includes the API and server-side logic necessary for the application.

## Prerequisites

Ensure you have the following installed on your system:
- Node.js (latest version recommended)
- npm (latest version recommended)

## Installation

To install dependencies, run:
```npm run install:backend```

## Development

To start the development server, run:
```npm run start:backend```

This command uses `nodemon` to start the Express server, which automatically restarts upon any changes to the TypeScript source code.

## Build

To compile TypeScript to JavaScript for production, run:
```npm run build:backend```

This compiles the code and outputs the JavaScript files to the `dist` directory.

## Start Production Server

After building the project, start the production server with:
```npm run start```

## Additional Information

- **Environment Setup**: Use `.env` files to manage environment variables. Ensure these are never committed to the repository (check `.gitignore`).
- **Configuration Files**: Check `tsconfig.json` for TypeScript compiler options and other backend configurations.

For more information on Node.js and Express, visit:
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
