require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start Express server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Inventory & Data Management System Server Running    `);
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  URL         : http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection] Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error(`[Uncaught Exception] Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Graceful Shutdown on termination signals
    const gracefulShutdown = () => {
      console.log('\n[Process] Shutting down gracefully...');
      server.close(() => {
        console.log('[Process] Express server closed');
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('[Process] MongoDB connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error(`Failed to launch server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
