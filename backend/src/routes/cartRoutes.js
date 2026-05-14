const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');

const router = express.Router();

router.get('/:userId', getCart);
router.post('/', addToCart);
router.put('/:userId/item/:productId', updateCartItem);
router.delete('/:userId/item/:productId', removeFromCart);
router.delete('/:userId', clearCart);

module.exports = router;
