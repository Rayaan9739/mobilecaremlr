const express = require('express');
const { getProducts, getProduct, getCategories, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories/list', getCategories);
router.get('/:id', getProduct);

// Admin routes
router.post('/', adminAuth, createProduct);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;
