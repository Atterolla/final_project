const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
require('dotenv').config(); // Load environment variables

// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate email template
const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'TravelPlanner',
        link: 'https://travelplanner.com/'
    }
});

// Function to send registration email
const sendRegistrationEmail = async (userEmail) => {
    try {
        const response = {
            body: {
                intro: 'Welcome to TravelPlanner!',
                table: {
                    data: [
                        {
                            item: 'Registration',
                            description: 'You have successfully registered.',
                            wish: 'Happy planning your trips!'
                        }
                    ]
                },
                outro: 'Thank you for choosing TravelPlanner.'
            }
        };

        const email = mailGenerator.generate(response);

        const message = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Welcome to TravelPlanner',
            html: email
        };

        await transporter.sendMail(message);
        console.log('Registration email sent to', userEmail);
    } catch (error) {
        console.error('Error sending registration email:', error);
    }
};

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => {
    res.render('login', { errors: [] }); // Pass an empty array if no errors initially
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true // Enable flash messages for authentication failures
    })(req, res, next);
});

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register', { errors: [] }); // Passing empty array as default value for errors
});

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Validate form fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, name, email, password, password2 });
    } else {
        try {
            const user = await User.findOne({ email: email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', { errors, name, email, password, password2 });
            } else {
                const newUser = new User({ name, email, password });
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(newUser.password, salt);
                newUser.password = hash;
                await newUser.save();

                // Send registration email
                await sendRegistrationEmail(email);

                req.flash('success_msg', 'You are now registered and can log in');
                res.redirect('/users/login');
            }
        } catch (err) {
            console.error(err);
        }
    }
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

module.exports = router;
