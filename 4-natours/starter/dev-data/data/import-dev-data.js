const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const prisma = new PrismaClient();

// READ JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
).map(tour => ({
  ...tour,
  startDates: tour.startDates.map(date => {
    // convert "2021-04-25,10:00" → "2021-04-25T10:00:00.000Z"
    const [d, t] = date.split(',');
    return new Date(`${d}T${t}:00.000Z`);
  }),
}));


// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await prisma.tour.createMany({
      data: tours,
      skipDuplicates: true, // optional, in case some IDs already exist
    });
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await prisma.tour.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
};

// RUN SCRIPT
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
