const Cart = require('../models/Cart');

// GET /api/cart/:userId
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate('items.product', 'name price image');
    if (!cart) return res.json({ user: req.params.userId, items: [] });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo carrito', error: error.message });
  }
};

// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ message: 'userId y productId son requeridos' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [{ product: productId, quantity }] });
    } else {
      const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }

    await cart.populate('items.product', 'name price image');
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando carrito', error: error.message });
  }
};

// PUT /api/cart/:userId/item/:productId
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

    const item = cart.items.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Producto no en el carrito' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price image');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando item', error: error.message });
  }
};

// DELETE /api/cart/:userId/item/:productId
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
    res.json({ message: 'Producto eliminado del carrito', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando del carrito', error: error.message });
  }
};

// DELETE /api/cart/:userId
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.params.userId },
      { items: [] },
      { new: true }
    );
    res.json({ message: 'Carrito vaciado', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error vaciando carrito', error: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
