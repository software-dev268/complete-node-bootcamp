require('dotenv').config({ path: './config.env' });
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Handle uncaught exceptions (synchronous errors)
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

async function main() {
  let server;

  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    console.log('DB connection successful!');

    const port = process.env.PORT || 3000;
    server = app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }

  // Handle unhandled promise rejections (async errors)
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
}

main();
