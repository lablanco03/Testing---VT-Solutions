const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getCategories);
router.post('/categories', protect, createCategory);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
