const express = require('express');
const {
  createOrder,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  updateOrderItems,
  deleteOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/',                       createOrder);
router.get('/:userId',                 getOrdersByUser);
router.get('/detail/:orderId',         getOrderById);
router.put('/:orderId/status', protect, updateOrderStatus);
router.put('/:orderId',                updateOrderItems);   // ← NUEVO: editar items
router.delete('/:orderId',             deleteOrder);        // ← NUEVO: eliminar orden

module.exports = router;
