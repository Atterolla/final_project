const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const path = require('path');
const api1Router = require('./routes/api1');

const app = express();

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
const connectToDB = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
    }
};
connectToDB();

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for rendering the dashboard
app.get('/dashboard', (req, res) => {
    const images = ['/images/1.jpg', '/images/2.jpg', '/images/3.jpg', '/images/4.jpg'];

    // Check if the user is authenticated
    if (req.isAuthenticated()) {
        // Extract the name field from the user object
        const { name } = req.user;
        // Pass only the name field to the dashboard template
        res.render('dashboard', { userName: name, images: images });
    } else {
        // If not authenticated, redirect to the login page
        res.redirect('/users/login');
    }
});


// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));

// Define a route to handle GET requests to /api1
app.use('/api1', api1Router);


const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server running on ${PORT}`));
