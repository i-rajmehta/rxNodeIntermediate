const userController = {
    register: async (req, res) => {
        const { name, email, password, phone_number, gender, address, profile_img } = req.query;
        var error = "";
        if (validator.isEmpty(name) || !validator.isAlphanumeric(name)) {
            error = 'Customer name should not be empty and contains Alphanumeric only.';
        }
        if (validator.isEmpty(email) || !validator.isEmail(email)) {
            error = 'Please enter email should not be empty and enter in correct format only.';
        }
        if (!validator.isLength(password, { min: 8, max: 50 })) {
            error = 'Password must containst atleast 8 character.';
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
    },
    login: async (req, res) => {
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
                    const userId = 1;
                    const token = jwt.sign({ customerID, email }, process.env.SECRETKEY); // generate JWT token using secret key
                    res.json({ token }); // return JWT token
                    // res.status(200).send('Login successful');
                } else {
                    res.status(401).send('Invalid username or password');
                }
            });
        });
    },
    getCustomers: async (req, res) => {
        // res.json({ message: 'Protected route accessed successfully', user: req.user });
        const { name, email } = req.query;
        console.log(name, email);
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
    },
    customerByID: async (req, res) => {
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
    },
    updateByCustomers: async (req, res) => {
        const { name, email, password, phone_number, gender, address, profile_img } = req.query;
        var error = "";
        if (validator.isEmpty(name) || !validator.isAlphanumeric(name)) {
            error = 'Customer name should not be empty and contains Alphanumeric only.';
        }
        if (validator.isEmpty(email) || !validator.isEmail(email)) {
            error = 'Please enter email should not be empty and enter in correct format only.';
        }
        if (!validator.isLength(password, { min: 8, max: 50 })) {
            error = 'Password must containst atleast 8 character.';
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
            console.log(error);
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
    },
    updateCustomer: async (req, res) => {
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
    },
    deleteCustomer: async (req, res) => {
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
    },
};

module.exports = { userController };