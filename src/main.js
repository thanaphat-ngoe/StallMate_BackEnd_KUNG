const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./config/db');
const passportConfig = require('./config/passportConfig');
require('./config/GoogleAuth');

// Routers
const authRouter = require('./routes/authRouter');
const homeRouter = require('./routes/homeRouter');
const menuRouter = require('./routes/menuRouter');
const orderRouter = require('./routes/orderRouter');
const customerOrderRouter = require('./routes/customerOrderRouter');
const setupProfileRouter = require('./routes/setupProfileRouter');
const favoriteStallRouter = require('./routes/favoriteStallRouter');
const ratingRouter = require('./routes/ratingRouter');
// const billingCardRouter = require('./routes/customerPaymentRouter');

// Middleware
const isLoggedIn = require('./middleware/authMiddleware');

const app = express();

// Database Connection
connectDB();

// App Configuration
app.set('trust proxy', 1); // For secure cookies behind proxies

// Middleware: CORS
app.use(cors({
    origin: [process.env.FRONT_END_BASE_URL], // Allowed origins
    credentials: true // Include credentials in requests
}));

// Middleware: Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'StallMateSecret', // Use an environment variable for the secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 60 * 60 // 1 hour session expiry
    }),
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'lax', // Prevent CSRF
        httpOnly: true // Prevent XSS
    }
}));

// Middleware: Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware: Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Route for Development
if (process.env.NODE_ENV === 'development') {
    app.get('/debug', (req, res) => {
        res.json({
            sessionId: req.sessionID,
            session: req.session,
            user: req.user,
            isAuthenticated: req.isAuthenticated()
        });
    });
}

// Routes
app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/dashboard/stallowner', isLoggedIn, setupProfileRouter);
app.use('/dashboard/stallowner', isLoggedIn, orderRouter);
app.use('/dashboard/stallowner', isLoggedIn, menuRouter);
app.use('/dashboard/customer', isLoggedIn, customerOrderRouter);
app.use('/dashboard/customer', isLoggedIn, ratingRouter);
app.use('/dashboard/customer', isLoggedIn, favoriteStallRouter);

// Uncomment if needed
// app.use('/dashboard/customer', isLoggedIn, billingCardRouter);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;