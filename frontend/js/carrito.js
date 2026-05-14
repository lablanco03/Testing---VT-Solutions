document.addEventListener('DOMContentLoaded', async function () {
  const tbody    = document.getElementById('cart-tbody');
  const summary  = document.getElementById('cart-summary');
  const countEl  = document.getElementById('cart-count');
  const totalEl  = document.getElementById('cart-total');
  const checkBtn = document.getElementById('checkout-btn');

  const userId = Auth.userId();
  if (!userId) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3">Debes <a href="Login.html">iniciar sesión</a> para ver tu carrito.</td></tr>';
    return;
  }

  async function loadCart() {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm text-primary"></div></td></tr>';
    try {
      const cart = await apiFetch(`/cart/${userId}`);
      renderCart(cart);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${err.message}</td></tr>`;
    }
  }

  function renderCart(cart) {
    const items = cart.items || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Tu carrito está vacío.</td></tr>';
      if (countEl) countEl.textContent = '0 artículos';
      if (totalEl) totalEl.textContent = '$0.00';
      if (checkBtn) checkBtn.classList.add('disabled');
      renderSummary([]);
      return;
    }

    tbody.innerHTML = items.map(item => {
      const p   = item.product;
      const sub = (p.price * item.quantity).toFixed(2);
      return `
        <tr>
          <td>
            <div class="d-flex gap-3 align-items-center">
              <img src="${p.image || `https://picsum.photos/seed/${p._id}/60/60`}"
                   width="50" height="50" style="object-fit:cover;border-radius:8px;"
                   onerror="this.src='https://picsum.photos/seed/${p._id}/60/60'">
              <div>
                <div class="fw-semibold">${p.name}</div>
                <button onclick="removeItem('${p._id}')">Eliminar</button>
              </div>
            </div>
          </td>
          <td class="text-center">
            <input type="number" class="form-control form-control-sm text-center qty-input"
                   value="${item.quantity}" min="1" style="width:70px;margin:auto;"
                   data-pid="${p._id}" onchange="updateQty('${p._id}', this.value)">
          </td>
          <td class="text-end">$${parseFloat(p.price).toFixed(2)}</td>
          <td class="text-end fw-semibold">$${sub}</td>
        </tr>`;
    }).join('');

    const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    if (countEl) countEl.textContent = `${items.length} artículo${items.length !== 1 ? 's' : ''}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    if (checkBtn) checkBtn.classList.remove('disabled');
    renderSummary(items);
  }

  function renderSummary(items) {
    if (!summary) return;
    const rows = items.map(i =>
      `<li class="list-group-item d-flex justify-content-between px-0">
        <span class="text-body-secondary">${i.product.name}</span>
        <span>$${(i.product.price * i.quantity).toFixed(2)}</span>
      </li>`).join('');
    const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    summary.innerHTML = `
      ${rows}
      <li class="list-group-item d-flex justify-content-between px-0 fw-semibold">
        <span>Total</span><span>$${total.toFixed(2)}</span>
      </li>`;
  }

  window.removeItem = async function (productId) {
    try {
      await apiFetch(`/cart/${userId}/item/${productId}`, { method: 'DELETE' });
      loadCart();
    } catch (err) { alert(err.message); }
  };

  window.updateQty = async function (productId, quantity) {
    try {
      await apiFetch(`/cart/${userId}/item/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });
      loadCart();
    } catch (err) { alert(err.message); }
  };

  await loadCart();
});
