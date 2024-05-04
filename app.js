// importing modules
const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config()
var validator = require('validator');
// require('server.js');

// initialising packages
const app = express();
const PORT = 3000;

// define middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// create databae connection
const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
});

// connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected to database as ID ' + connection.threadId);
});

// create table query
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS customer_master (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(11) NOT NULL,
    gender VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    profile_img VARCHAR(255) NOT NULL
  )
`;

// executing create table query
connection.query(createTableQuery, (error, results, fields) => {
    if (error) {
        console.error('Error occured while executing the query: ' + error.stack);
        return;
    }
    console.log('customer_master table has been successfully created:', results);
});

// connection.end();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
