const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// added user express-session middleware
const session = require('express-session');
app.use(session({
  secret: 'secret-dog',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 // 1 day session lifetime
  }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
// added route for dogRoutes to show dog name on owner dashboard
const dogRoutes = require('./routes/dogRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;