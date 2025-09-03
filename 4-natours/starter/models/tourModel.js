const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// const validator = require('validator');


exports.getTourStats = async () => {
  return await prisma.tour.groupBy({
    by: ['difficulty'],
    where: { ratingsAverage: { gte: 4.5 } },
    _count: { _all: true, ratingsQuantity: true },
    _avg: { ratingsAverage: true, price: true },
    _min: { price: true },
    _max: { price: true },
    orderBy: { _avg: { price: 'asc' } },
  });
};

// Monthly plan logic could also live here
exports.getMonthlyPlan = async (year) => {
  const tours = await prisma.tour.findMany({
    select: { id: true, name: true, startDates: true },
  });

  const allDates = [];
  tours.forEach(tour => {
    tour.startDates.forEach(date => {
      if (date >= new Date(`${year}-01-01`) && date <= new Date(`${year}-12-31`)) {
        allDates.push({ month: date.getMonth() + 1, name: tour.name });
      }
    });
  });

  const planMap = {};
  allDates.forEach(({ month, name }) => {
    if (!planMap[month]) planMap[month] = { month, numTourStarts: 0, tours: [] };
    planMap[month].numTourStarts += 1;
    planMap[month].tours.push(name);
  });

  return Object.values(planMap).sort((a, b) => b.numTourStarts - a.numTourStarts).slice(0, 12);
};
