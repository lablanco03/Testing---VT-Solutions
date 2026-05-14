document.addEventListener('DOMContentLoaded', async function () {
  const userId = Auth.userId();
  if (!userId) { window.location.href = 'Login.html'; return; }

  const container  = document.getElementById('orders-container');
  const emptyMsg   = document.getElementById('empty-msg');
  const ONE_HOUR   = 60 * 60 * 1000;

  // ID de orden en edición (persistido en sessionStorage)
  let editingOrderId = sessionStorage.getItem('vt_editing_order');

  // Si el usuario volvió del catálogo con el carrito actualizado, mostrar modal de confirmación
  if (editingOrderId) {
    const banner = document.getElementById('editing-banner');
    if (banner) {
      banner.classList.remove('d-none');
      document.getElementById('editing-order-id').textContent = `#VT-${editingOrderId.slice(-6).toUpperCase()}`;
    }
  }

  // Cargar órdenes
  async function loadOrders() {
    container.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`;
    try {
      const orders = await apiFetch(`/orders/${userId}`);
      if (!orders.length) {
        container.innerHTML = '';
        emptyMsg.classList.remove('d-none');
        return;
      }
      emptyMsg.classList.add('d-none');
      renderOrders(orders);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  }

  // Renderizar lista de órdenes
  function renderOrders(orders) {
    container.innerHTML = orders.map(order => {
      const created   = new Date(order.createdAt);
      const elapsed   = Date.now() - created.getTime();
      const canEdit   = !order.edited && elapsed < ONE_HOUR;
      const remaining = canEdit ? Math.ceil((ONE_HOUR - elapsed) / 60000) : 0;
      const dateStr   = created.toLocaleString('es-CR');
      const orderCode = `#VT-${order._id.slice(-6).toUpperCase()}`;

      const statusBadge = {
        pendiente:   'bg-warning text-dark',
        procesando:  'bg-info text-dark',
        enviado:     'bg-primary',
        entregado:   'bg-success',
        cancelado:   'bg-secondary'
      }[order.status] || 'bg-secondary';

      const itemsHtml = order.items.map(item => `
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom" id="item-row-${order._id}-${item.product}">
          <span class="small">${item.name} × ${item.quantity}</span>
          <div class="d-flex align-items-center gap-2">
            <span class="small fw-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
            ${canEdit ? `
              <div class="input-group input-group-sm" style="width:80px">
                <input type="number" min="1" value="${item.quantity}"
                  class="form-control form-control-sm text-center qty-input"
                  data-order="${order._id}" data-product="${item.product}"
                  data-name="${item.name}" data-price="${item.price}">
              </div>
              <button class="btn btn-outline-danger btn-sm py-0"
                onclick="removeItem('${order._id}', '${item.product}')">✕</button>
            ` : ''}
          </div>
        </div>`).join('');

      const editActionsHtml = canEdit ? `
        <div class="d-flex flex-wrap gap-2 mt-3">
          <button class="btn btn-sm btn-outline-primary"
            onclick="goAddProducts('${order._id}')">
            ＋ Agregar productos desde catálogo
          </button>
          <button class="btn btn-sm btn-primary"
            onclick="saveOrderChanges('${order._id}')">
             Guardar cambios
          </button>
          <button class="btn btn-sm btn-outline-danger"
            onclick="confirmDeleteOrder('${order._id}', '${orderCode}')">
             Eliminar pedido
          </button>
        </div>
        <p class="text-muted small mt-2 mb-0">
           Tiempo restante para editar: <strong>${remaining} min</strong>
        </p>` : `
        <p class="text-muted small mt-3 mb-0">
          ${order.edited ? '✓ Este pedido ya fue editado (edición única).' : ' El plazo de edición (1 hora) ya expiró.'}
        </p>`;

      return `
        <div class="card shadow-sm border-0 mb-4" id="order-card-${order._id}">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h5 class="mb-0 fw-bold">${orderCode}</h5>
                <span class="text-muted small">${dateStr}</span>
              </div>
              <span class="badge ${statusBadge} align-self-start text-capitalize">${order.status}</span>
            </div>

            <div class="mb-2" id="items-list-${order._id}">
              ${itemsHtml}
            </div>

            <div class="d-flex justify-content-between fw-bold mt-2">
              <span>Total</span>
              <span id="order-total-${order._id}">$${order.total.toFixed(2)}</span>
            </div>

            ${order.shippingAddress ? `<p class="text-muted small mt-1 mb-0"> Destino: ${order.shippingAddress}</p>` : ''}

            ${editActionsHtml}
          </div>
        </div>`;
    }).join('');
  }

  // Ir al catálogo para agregar productos
  window.goAddProducts = function (orderId) {
    sessionStorage.setItem('vt_editing_order', orderId);
    window.location.href = 'catalogo.html';
  };

  // Guardar cambios (sobrescribe orden)
  window.saveOrderChanges = async function (orderId) {
    // Recolectar items del carrito actual + items modificados en pantalla
    const qtyInputs = document.querySelectorAll(`.qty-input[data-order="${orderId}"]`);
    
    const items = [];
    qtyInputs.forEach(input => {
      const qty = parseInt(input.value);
      if (qty > 0) {
        items.push({
          product: input.dataset.product,
          name: input.dataset.name,
          price: parseFloat(input.dataset.price),
          quantity: qty
        });
      }
    });

    // Si hay una sesión de edición activa (volvió del catálogo), fusionar con carrito
    if (sessionStorage.getItem('vt_editing_order') === orderId) {
      try {
        const cart = await apiFetch(`/cart/${userId}`);
        if (cart.items && cart.items.length > 0) {
          cart.items.forEach(cartItem => {
            const existing = items.find(i => i.product === cartItem.product._id);
            if (existing) {
              existing.quantity += cartItem.quantity;
            } else {
              items.push({
                product: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                quantity: cartItem.quantity
              });
            }
          });
          // Vaciar carrito después de fusionar
          await apiFetch(`/cart/${userId}`, { method: 'DELETE' });
        }
      } catch { /* carrito vacío o error, continuar con items actuales */ }
      sessionStorage.removeItem('vt_editing_order');
    }

    if (!items.length) {
      showToast('❌ No hay productos en la orden. Usa "Eliminar pedido" para borrarla.', true);
      return;
    }

    try {
      const updated = await apiFetch(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ items })
      });
      showToast(`✅ Pedido #VT-${orderId.slice(-6).toUpperCase()} actualizado correctamente`);
      hideBanner();
      await loadOrders();
    } catch (err) {
      
    }
  };

  // Eliminar item individual de la UI
  window.removeItem = function (orderId, productId) {
    const input = document.querySelector(`.qty-input[data-order="${orderId}"][data-product="${productId}"]`);
    if (input) {
      const row = input.closest('.border-bottom');
      if (row) row.remove();
    }
    // Recalcular total visual
    recalcTotal(orderId);
  };

  function recalcTotal(orderId) {
    let total = 0;
    document.querySelectorAll(`.qty-input[data-order="${orderId}"]`).forEach(inp => {
      total += parseFloat(inp.dataset.price) * parseInt(inp.value || 1);
    });
    const el = document.getElementById(`order-total-${orderId}`);
    if (el) el.textContent = `$${total.toFixed(2)}`;
  }

  // Recalcular total al cambiar cantidades
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('qty-input')) {
      recalcTotal(e.target.dataset.order);
    }
  });

  // Confirmar y eliminar orden completa
  window.confirmDeleteOrder = function (orderId, orderCode) {
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteModalOrderCode').textContent = orderCode;
    document.getElementById('confirmDeleteBtn').onclick = () => deleteOrder(orderId);
    new bootstrap.Modal(modal).show();
  };

  window.deleteOrder = async function (orderId) {
    try {
      await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
      bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
      showToast(`✅ Pedido eliminado`);
      const card = document.getElementById(`order-card-${orderId}`);
      if (card) card.remove();
      // Verificar si quedan órdenes
      const remaining = document.querySelectorAll('[id^="order-card-"]');
      if (!remaining.length) {
        container.innerHTML = '';
        emptyMsg.classList.remove('d-none');
      }
    } catch (err) {
      bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
      
    }
  };

  // Aplicar cambios del carrito
  const applyCartBtn = document.getElementById('apply-cart-btn');
  if (applyCartBtn && editingOrderId) {
    applyCartBtn.onclick = () => saveOrderChanges(editingOrderId);
  }

  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  if (cancelEditBtn) {
    cancelEditBtn.onclick = () => {
      sessionStorage.removeItem('vt_editing_order');
      hideBanner();
    };
  }

  function hideBanner() {
    const banner = document.getElementById('editing-banner');
    if (banner) banner.classList.add('d-none');
  }

  // Toast
  function showToast(msg, error = false) {
    let t = document.getElementById('vt-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'vt-toast';
      t.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;min-width:260px;';
      document.body.appendChild(t);
    }
    t.innerHTML = `<div class="alert alert-${error ? 'danger' : 'success'} shadow py-2 mb-0">${msg}</div>`;
    setTimeout(() => { t.innerHTML = ''; }, 3000);
  }

  await loadOrders();
});
