// importing modules
const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
require('dotenv').config()
var validator = require('validator');

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

// customer registration route
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone_number, gender, address, profile_img } = req.query;
    var error = "";
    if (validator.isEmpty(name) || !validator.isAlphanumeric(name)) {
        error = 'Customer name should not be empty and contains Alphanumeric only.';
    }
    if (validator.isEmpty(email) || !validator.isEmail(email)) {
        error = 'Please enter email should not be empty and enter in correct format only.';
    }
    if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minSymbols: 1 })) {
        error = 'Password must containst atleast 8 character long and Contains one UpperCase, one LowerCase and one Spcial Symbol.';
    }
    if (!validator.isNumeric(phone_number) || !validator.isLength(phone_number, { min: 10, max: 10 })) {
        error = 'Phone Number should be numeric only and lenght of 10.';
    }
    if (!validator.isEmpty(gender)) {
        if (!validator.equals(gender.toLowerCase(), "male") && !validator.equals(gender.toLowerCase(), "female") && !validator.equals(gender.toLowerCase(), "other")) {
            error = 'Gender must be from `Male`, `Female` and `Other`.';
        }
    }
    if (!validator.isLength(address, { min: 0, max: 255 })) {
        error = 'Address should not be more than 255 character.';
    }
    if (error != '') {
        res.status(401).json(error);
        return;
    }
    var customerAddress = validator.escape(address);
    var customerName = validator.trim(name);
    await bcrypt.hash(password, 10, async (err, encryptedPassword) => {
        if (err) {
            res.status(500).send('Error occured during the hashing password');
            return;
        }
        /* if (!validator.isMimeType(profile_img)) {
            res.status(401).send('Image must be in correct format.');
            return;
        } */
        const insertQuery = `INSERT INTO customer_master (name, email, password, phone_number, gender, address, profile_img ) VALUES (?, ?, ?, ?, ?, ? ,?)`;
        await connection.query(insertQuery, [customerName, email, encryptedPassword, phone_number, gender, customerAddress, profile_img], (error, results, fields) => {
            if (error) {
                console.error('An error occurred while inserting data: ' + error.stack);
                res.status(500).send('An error occurred while inserting data');
            } else {
                res.status(201).send('Data inserted successfully');
            }
        });
    });
});

// customer login route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.query;
    const selectQuery = 'SELECT * FROM customer_master WHERE email = ?';
    await connection.query(selectQuery, [email, password], (error, results, fields) => {
        if (error) {
            res.status(500).send('Error occured during logging in');
            return;
        }
        if (results.length === 0) {
            res.status(401).send('Please enter valid username and password.');
            return;
        }
        const hashedPassword = results[0].password;
        const customerID = results[0].id;
        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (result) {
                const token = jwt.sign({ customerID, email }, process.env.SECRETKEY); // generate JWT token using secret key
                res.json({ token }); // return JWT token
                // res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid username or password');
            }
        });
    });
});

// create middleware to verify JWT token before allowing user to fetch the customer list
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Token is required' });
    }
    jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// customer login route to generate JWT token
app.get('/api/customers', verifyToken, async (req, res) => {
    const { name, email } = req.query;
    const selectQuery = `SELECT * FROM customer_master WHERE name = ? or email = ? `;
    await connection.query(selectQuery, [name, email], (error, results, fields) => {
        if (error) {
            res.status(500).send(error);
            return;
        }
        if (results.length === 0) {
            res.status(401).send('Input data is not found in list.');
            return;
        }
        res.status(200).json({ results })
    });
});

// get id specific customer details
app.get('/api/customers/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const selectQuery = `SELECT * FROM customer_master WHERE id = ?`;
    await connection.query(selectQuery, [id], (error, results, fields) => {
        if (error) {
            res.status(500).send(error);
            return;
        }
        if (results.length === 0) {
            res.status(401).send('Input data is not found in list.');
            return;
        }
        res.status(200).json({ results })
    });
});

// route to insert customer by authorised user
app.post('/api/customers', verifyToken, async (req, res) => {
    const { name, email, password, phone_number, gender, address, profile_img } = req.query;
    await bcrypt.hash(password, 10, async (err, encryptedPassword) => {
        if (err) {
            res.status(500).send('Error occured during the hashing password');
            return;
        }
        const insertQuery = `INSERT INTO customer_master (name, email, password, phone_number, gender, address, profile_img ) VALUES (?, ?, ?, ?, ?, ? ,?)`;
        await connection.query(insertQuery, [name, email, encryptedPassword, phone_number, gender, address, profile_img], (error, results, fields) => {
            if (error) {
                console.error('An error occurred while inserting data: ' + error.stack);
                res.status(500).send('An error occurred while inserting data');
            } else {
                res.status(201).send('Data inserted successfully');
            }
        });
    });
});

// update customer details
app.put('/api/customers/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const { name, email, password, phone_number, gender, address, profile_img } = req.query;

    const updateQuery = `UPDATE customer_master SET name = ?, email = ?, password = ?, phone_number = ?, gender = ?, address = ?, profile_img = ? WHERE id = ?`;
    await connection.query(updateQuery, [name, email, password, phone_number, gender, address, profile_img, id], (error, results, fields) => {
        if (error) {
            res.status(500).send(error);
            return;
        } else {
            res.status(200).send(`Record has been updated for the customer ID ${id}.`);
        }
    });
});

// delete customer details
app.delete('/api/customers/:id', verifyToken, async (req, res) => {
    const id = req.params.id;

    const selectQuery = `SELECT * FROM customer_master WHERE id = ?`;
    await connection.query(selectQuery, [id], (error, results, fields) => {
        if (error) {
            res.status(500).send(error);
            return;
        }
        if (results.length === 0) {
            res.status(401).send('Input data is not found in list.');
            return;
        } else {
            const updateQuery = `DELETE FROM customer_master WHERE id = ?`;
            connection.query(updateQuery, [id], (error, results, fields) => {
                if (error) {
                    res.status(500).send(error);
                    return;
                } else {
                    res.status(200).send(`Record has been permanently deleted for the customer ID ${id}.`);
                }
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
