const AppError = require('./appError');

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        // Known / expected errors
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Programming or unknown errors → don't leak details
    console.error('ERROR 💥', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
    });
};

module.exports = (err, req, res, next) => {
    // Default fallbacks
    let error = err;
    error.statusCode = error.statusCode || 500;
    error.status = error.status || (String(error.statusCode).startsWith('4') ? 'fail' : 'error');

    // Prisma "missing required field"
    if (err.message && /Argument `(.*?)` is missing/.test(err.message)) {
        const match = err.message.match(/Argument `(.*?)` is missing/);
        const field = match ? match[1] : 'unknown';
        error = new AppError(`The field '${field}' is required`, 400);
    }

    // Prisma "invalid value" type errors
    if (err.message && /Invalid value provided/.test(err.message)) {
        const match = err.message.match(/Argument `(.*?)`: Invalid value provided/);
        const field = match ? match[1] : 'unknown';
        error = new AppError(`Invalid value for '${field}'`, 400);
    }

    // Prisma record not found
    if (err.code === 'P2025') {
        error = new AppError('No tour found with that ID', 404);
    }



    // Send based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === 'production') {
        if (error.code === 'P2002') {
            const field = error.meta && error.meta.target ? error.meta.target.join(', ') : 'field';
            error = new AppError(`Duplicate field value: ${field}. Please use another value!`, 400);
        }
        sendErrorProd(error, res);
    }
};
