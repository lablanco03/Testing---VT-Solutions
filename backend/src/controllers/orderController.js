const Order = require('../models/Order');
const Cart  = require('../models/Cart');

const ONE_HOUR_MS = 60 * 60 * 1000;

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { userId, shippingAddress } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId es requerido' });

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: 'El carrito está vacío' });

    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await Order.create({ user: userId, items, total, shippingAddress: shippingAddress || '' });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error creando orden', error: err.message });
  }
};

// GET /api/orders/:userId
const getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo órdenes', error: err.message });
  }
};

// GET /api/orders/detail/:orderId
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo orden', error: err.message });
  }
};

// PUT /api/orders/:orderId/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error actualizando estado', error: err.message });
  }
};

// ─── NUEVO: PUT /api/orders/:orderId ─────────────────────────────────────────
// Sobrescribe los items de una orden (solo si no fue editada y está dentro de 1 hora)
const updateOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;  // array de {product, name, price, quantity}

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Se requieren items válidos' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    // Validación: solo editable una vez
    if (order.edited)
      return res.status(403).json({ message: 'Esta orden ya fue editada anteriormente' });

    // Validación: solo dentro de 1 hora
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    if (elapsed > ONE_HOUR_MS)
      return res.status(403).json({ message: 'El tiempo para editar esta orden ha expirado (1 hora)' });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { items, total, edited: true },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error actualizando orden', error: err.message });
  }
};

// ─── NUEVO: DELETE /api/orders/:orderId ─────────────────────────────────────
// Elimina una orden completa (solo si no fue editada y está dentro de 1 hora)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    // Validación: solo editable una vez
    if (order.edited)
      return res.status(403).json({ message: 'Esta orden ya fue editada, no puede eliminarse' });

    // Validación: solo dentro de 1 hora
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    if (elapsed > ONE_HOUR_MS)
      return res.status(403).json({ message: 'El tiempo para eliminar esta orden ha expirado (1 hora)' });

    await Order.findByIdAndDelete(orderId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error eliminando orden', error: err.message });
  }
};

module.exports = { createOrder, getOrdersByUser, getOrderById, updateOrderStatus, updateOrderItems, deleteOrder };
