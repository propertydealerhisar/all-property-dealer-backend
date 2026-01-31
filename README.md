# Property Dealer Backend

A backend application for property dealing with MongoDB database connection.

## Folder Structure

```
backendpropertydealer/
├── config/
│   └── db.js                 # Database connection
├── controllers/              # Request handlers
│   └── authController.js
├── middleware/               # Custom middleware
│   └── auth.js
├── models/                   # Mongoose models
│   └── User.js
├── routes/                   # API routes
│   └── auth.js
├── utils/                    # Utility functions
│   └── errorHandler.js
├── .env                      # Environment variables
├── .gitignore
├── server.js                 # Main server file
├── package.json
└── package-lock.json
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
MONGODB_URI=mongodb://localhost:27017/propertydealer

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Server
PORT=5000

# Other configurations
NODE_ENV=development
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on the example above

3. Run the application:
```bash
# For development
npm run dev

# For production
npm start
```

## Features

- MongoDB database connection with Mongoose
- JWT authentication
- User registration and login
- Protected routes middleware
- Environment variable configuration




GET http://localhost:5000/api/get
GET http://localhost:5000/api/get/jewar-city-property-noida
