var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// module.exports = app;


(async () => {
    try {
      // Connect to MySQL without specifying a database
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' // Set your MySQL root password
      });

      // Create the database if it doesn't exist
      await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
      await connection.end();

      // Now connect to the created database
      db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'DogWalkService'
      });

      // Create a table if it doesn't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('owner', 'walker') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS Dogs (
                dog_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                size ENUM('small', 'medium', 'large') NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES Users(user_id)
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                dog_id INT NOT NULL,
                requested_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkApplications (
                application_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                CONSTRAINT unique_application UNIQUE (request_id, walker_id)
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkRatings (
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                owner_id INT NOT NULL,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                FOREIGN KEY (owner_id) REFERENCES Users(user_id),
                CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
            );
        `);

      // Insert data if table is empty
      const [userCount] = await db.execute('SELECT COUNT(*) AS count FROM Users');
      if (userCount[0].count === 0) {
        await db.execute(`
            INSERT INTO Users (username, email, password_hash, role)
            VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('lisawalker', 'lisa@example.com', 'hashed111', 'walker'),
            ('pammy123', 'pam@example.com', 'hashed222', 'owner');
        `);
      }

      const [dogCount] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
      if (dogCount[0].count === 0) {
        await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'bobwalker'), 'Minion', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'lisawalker'), 'Kumo', 'small'),
        ((SELECT user_id FROM Users WHERE username =  'pammy123'), 'Lucy', 'small');
        `);
      }

      const [walkCount] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
      if (walkCount[0].count === 0) {
        await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        (
            (SELECT dog_id FROM Dogs WHERE name = 'Max' and owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
            '2025-06-10 08:00:00', 30, 'Parklands', 'open'
        ),

        (
            (SELECT dog_id FROM Dogs WHERE name = 'Bella' and owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),
            '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'
        ),

        (
            (SELECT dog_id FROM Dogs WHERE name = 'Minion' and owner_id = (SELECT user_id FROM Users WHERE username = 'bobwalker')),
            '2025-06-10 10:30:00', 45, 'Hampstead', 'open'
        ),

        (
            (SELECT dog_id FROM Dogs WHERE name = 'Kumo' and owner_id = (SELECT user_id FROM Users WHERE username = 'lisawalker')),
            '2025-06-10 11:30:00', 30, 'Bangkok', 'open'
        ),

        (
            (SELECT dog_id FROM Dogs WHERE name = 'Lucy' and owner_id = (SELECT user_id FROM Users WHERE username = 'pammy123')),
            '2025-08-10 14:30:00', 60, 'Emporium', 'open'
        );
        `);
      }

      const [ratingCount] = await db.execute('SELECT COUNT(*) AS count FROM WalkRatings');
      if (ratingCount[0].count === 0) {
        await db.execute(`
            INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating)
            VALUES (
            (SELECT request_id FROM WalkRequests WHERE status = 'accepted'),
            (SELECT user_id FROM Users WHERE username = 'bobwalker'),
            (SELECT user_id FROM Users WHERE username = 'carol123'),
            5
            );
        `);
      }


    } catch (err) {
      console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
    }
})();

// route to return
// api/dogs

app.get('/api/dogs', async (req,res) => {
    try{
        const [dogs] = await db.execute(`
        SELECT d.name AS dog_name, d.size, u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id`);
        res.json(dogs);

    } catch (err){
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }

});

app.get('/api/walkrequests/open', async (req,res) => {
    try {
        const [requests] = await db.execute(`
            SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
            FROM WalkRequests wr
            JOIN Dogs d ON wr.dog_id = d.dog_id
            JOIN Users u on d.owner_id = u.user_id
            WHERE wr.status = 'open'
        `);
        res.json(requests);

    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch open walkrequests' });
    }
});

app.get('/api/walkers/summary', async (req,res) => {
    try {
        const [summary] = await db.execute(`
            SELECT u.username AS walker_username,
            COUNT(r.rating_id) AS total_ratings,
            ROUND(AVG(r.rating), 1) AS average_rating,
            COUNT(DISTINCT wr.request_id) AS completed_walks
            FROM Users u
            LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
            LEFT JOIN WalkRequests wr ON wr.request_id = r.request_id AND wr.status = 'completed'
            WHERE u.role = 'walker'
            GROUP BY u.user_id
        `);
        res.json(summary);

    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch walker summary' });
    }
});


app.use(express.static(path.join(__dirname, 'public')));
module.exports = app;