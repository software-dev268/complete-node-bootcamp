const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Connect to PostgreSQL
    await prisma.$connect();
    console.log('DB connection successful!');

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

main();
