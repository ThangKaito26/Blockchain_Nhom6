const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static route for uploads if needed locally
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport Setup
const passport = require('passport');
require('./utils/passport-setup');
app.use(passport.initialize());
app.use(passport.session());

// Global variable for view templates
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.admin = req.session.admin || null;
    next();
});

// Routes
const homeRoutes = require('./controllers/homeController');
const adminRoutes = require('./controllers/adminController');
const userRoutes = require('./controllers/userController');

app.use('/', homeRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/auth', userRoutes); // For Google OAuth routes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
