const { PrismaClient } = require('@prisma/client');
const APIFeatures = require('../utils/apiFeatures');
const TourModel = require('../models/tourModel');

const prisma = new PrismaClient({
  omit: { tour: { createdAt: true } },
});

// ✅ Don’t mutate req.query. Stash overrides separately.
exports.aliasTopTours = (req, res, next) => {
  req._queryOverrides = {
    limit: '5',
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // ✅ Merge overrides with actual query into a plain object
    const query = { ...(req._queryOverrides || {}), ...(req.query || {}) };

    const features = new APIFeatures(query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Optional: peek at what we’re sending to Prisma
    // console.log('merged query:', query);
    // console.log('prismaOptions:', features.prismaOptions);

    const tours = await prisma.tour.findMany(features.prismaOptions);

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// small extra fix: if your Tour.id is Int in Prisma, parse it
exports.getTour = async (req, res) => {
  try {
    const id = Number.isNaN(+req.params.id) ? req.params.id : +req.params.id;
    const tour = await prisma.tour.findUnique({ where: { id } });
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({})
    // newTour.save()

    const newTour = await prisma.tour.create({
      data: req.body
    });

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await prisma.tour.delete({
      where: { id: req.params.id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err.message });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const plan = await TourModel.getMonthlyPlan(Number(req.params.year));
    res.status(200).json({ status: 'success', data: { plan } });
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err.message });
  }
};