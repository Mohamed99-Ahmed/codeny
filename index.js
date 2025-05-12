const mongoose = require("mongoose");
const app = require("./app.js");
const dotenv = require("dotenv");

// Try to load environment variables, but don't fail if file doesn't exist (for Vercel)
try {
  dotenv.config({ path: "./config.env" });
} catch (err) {
  console.log("No config.env file found, using environment variables");
}

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! �� Shutting down...");
  console.error(err.name, err.message);
  // Don't exit the process in serverless environment
  // process.exit(1);
});

// unhandledRejection handler
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! �� Shutting down...");
  console.error(err.name, err.message);
  // Don't exit the process in serverless environment
  // process.exit(1);
});

// Safe DB connection string formation
let DB = "";
try {
  if (process.env.DATABASE && process.env.DATABASE_PASSWORD) {
    DB = process.env.DATABASE.replace("<db_password>", process.env.DATABASE_PASSWORD);
  } else {
    console.error("Missing database connection information");
  }
} catch (err) {
  console.error("Error setting up database connection string:", err.message);
}

// For serverless: track connection status
let isConnected = false;

// Connect to database - optimized for serverless
const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    if (!DB) {
      throw new Error("Database connection string is empty");
    }
    
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to connect for 5 seconds
      bufferCommands: false, // Disable buffering to fail fast if connection fails
    };

    await mongoose.connect(DB, options);
    isConnected = true;
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err.message);
    isConnected = false;
  }
};

// For local development: start Express server
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  connectDB().then(() => {
    const server = app.listen(port, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    });
  });
} else {
  // For serverless: just connect to database before handling requests
  connectDB();
}

// Export the app for Vercel
module.exports = app;
