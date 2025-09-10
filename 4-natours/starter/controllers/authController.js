const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.signup = async (req, res, next) => {
    try {
        const { password, passwordConfirm, ...rest } = req.body;

        if (password !== passwordConfirm) {
            return res.status(400).json({
                status: 'fail',
                message: 'Passwords do not match'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                name: rest.name,
                email: rest.email,
                password: hashedPassword
            }
        });

        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
