const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    database: 'DogWalkService',
    user: 'root'

});

module.exports = pool;