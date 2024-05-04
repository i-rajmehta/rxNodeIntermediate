
const express = require('express');
const { userController } = require("controllers/userControllers.js");

const router = new express();

// define middleware to parse incoming request bodies
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

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

router.post('/api/auth/register', userController.register);
router.post('/api/auth/login', userController.login);
router.get('/api/customers', verifyToken, userController.getCustomers);
router.get('/api/customers/:id', verifyToken, userController.customerByID);
router.post('/api/customers', verifyToken, userController.updateByCustomers);
router.put('/api/customers/:id', verifyToken, userController.updateCustomer);
router.delete('/api/customers/:id', verifyToken, userController.deleteCustomer);

module.exports = { router };