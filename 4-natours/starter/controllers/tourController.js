const { PrismaClient } = require('@prisma/client');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const TourModel = require('../models/tourModel');

const prisma = new PrismaClient({
  omit: { tour: { createdAt: true } },
});

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await prisma.tour.findMany(features.prismaOptions);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const id = Number.isNaN(+req.params.id) ? req.params.id : +req.params.id;
  const tour = await prisma.tour.findUnique({ where: { id } });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({ status: 'success', data: { tour } });
});

exports.createTour = catchAsync(async (req, res, next) => {

  const newTour = await prisma.tour.create({ data: req.body });

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await prisma.tour.update({
    where: { id: req.params.id },
    data: req.body
  });

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});


exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await prisma.tour.delete({
    where: { id: req.params.id }
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await TourModel.getTourStats();
  const formatted = stats.map(s => ({
    difficulty: s.difficulty.toUpperCase(),
    numTours: s._count._all,
    numRatings: s._count.ratingsQuantity,
    avgRating: s._avg.ratingsAverage,
    avgPrice: s._avg.price,
    minPrice: s._min.price,
    maxPrice: s._max.price,
  }));
  res.status(200).json({ status: 'success', data: { stats: formatted } });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const plan = await TourModel.getMonthlyPlan(Number(req.params.year));
  res.status(200).json({ status: 'success', data: { plan } });
});
exports.aliasTopTours = catchAsync(async (req, res, next) => {
  const tours = await TourModel.getTourTop5Cheap();
  res.status(200).json({ status: 'success', data: { tours } });
});
