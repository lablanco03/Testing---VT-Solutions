document.addEventListener('DOMContentLoaded', async function () {
  const userId = Auth.userId();
  if (!userId) {
    window.location.href = 'Login.html';
    return;
  }

  const orderSection  = document.getElementById('order-result');
  const formSection   = document.getElementById('checkout-form-section');
  const checkoutForm  = document.getElementById('checkout-form');
  const conversionBox = document.getElementById('currency-conversion');

  let cartTotal = 0;
  let rates     = null;

  // ── Cargar tasas de cambio ────────────────────────────────────────────────
  async function loadRates() {
    try {
      const data = await apiFetch('/external/rates');
      rates = data.rates;
    } catch {
      rates = null;
    }
  }

  function renderConversion(totalUSD) {
    if (!conversionBox) return;
    if (!rates) {
      conversionBox.innerHTML = '<p class="text-muted small">No se pudieron cargar las tasas de cambio.</p>';
      return;
    }
    const crc = (totalUSD * rates.CRC).toFixed(0);
    const eur = (totalUSD * rates.EUR).toFixed(2);
    const mxn = (totalUSD * rates.MXN).toFixed(2);

    conversionBox.innerHTML = `
      <div class="alert alert-info py-2 mb-0">
        <div class="fw-semibold mb-2">💱 Equivalencia en otras monedas</div>
        <div class="d-flex flex-wrap gap-3">
          <div>
            <span class="text-muted small">USD</span><br>
            <span class="fw-bold fs-5">$${parseFloat(totalUSD).toFixed(2)}</span>
          </div>
          <div>
            <span class="text-muted small">Colones (CRC)</span><br>
            <span class="fw-bold fs-5">₡${parseInt(crc).toLocaleString('es-CR')}</span>
          </div>
          <div>
            <span class="text-muted small">Euros (EUR)</span><br>
            <span class="fw-bold fs-5">€${eur}</span>
          </div>
          <div>
            <span class="text-muted small">Pesos MX (MXN)</span><br>
            <span class="fw-bold fs-5">MX$${parseFloat(mxn).toLocaleString('es-MX')}</span>
          </div>
        </div>
        <div class="text-muted small mt-2">
          Tasas en tiempo real · 1 USD = ₡${Math.round(rates.CRC)} | €${rates.EUR?.toFixed(4)} | MX$${rates.MXN?.toFixed(2)}
        </div>
      </div>`;
  }

  // ── Cargar resumen del carrito ────────────────────────────────────────────
  try {
    const cart  = await apiFetch(`/cart/${userId}`);
    const items = cart.items || [];
    const previewEl = document.getElementById('order-preview');

    if (previewEl && items.length) {
      cartTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
      previewEl.innerHTML = items.map(i =>
        `<li class="list-group-item d-flex justify-content-between px-0">
          <span>${i.product.name} × ${i.quantity}</span>
          <span>$${(i.product.price * i.quantity).toFixed(2)}</span>
        </li>`).join('') +
        `<li class="list-group-item d-flex justify-content-between px-0 fw-bold border-top">
          <span>Total (USD)</span><span>$${cartTotal.toFixed(2)}</span>
        </li>`;

      await loadRates();
      renderConversion(cartTotal);
    } else if (previewEl) {
      previewEl.innerHTML = '<li class="list-group-item px-0 text-muted">Tu carrito está vacío.</li>';
    }
  } catch { /* no bloquea el resto */ }

  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const address = document.getElementById('shipping-address')?.value.trim() || '';
    const btn = checkoutForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      const order = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ userId, shippingAddress: address })
      });

      if (formSection)  formSection.classList.add('d-none');
      if (orderSection) {
        orderSection.classList.remove('d-none');
        document.getElementById('order-number').textContent = `#VT-${order._id.slice(-6).toUpperCase()}`;
        document.getElementById('order-total').textContent  = `$${order.total.toFixed(2)}`;
        document.getElementById('order-status').textContent = order.status;

        // Mostrar conversión también en la confirmación
        const confirmConv = document.getElementById('confirm-conversion');
        if (confirmConv && rates) {
          const crc = Math.round(order.total * rates.CRC).toLocaleString('es-CR');
          const eur = (order.total * rates.EUR).toFixed(2);
          const mxn = parseFloat((order.total * rates.MXN).toFixed(2)).toLocaleString('es-MX');
          confirmConv.innerHTML = `
            <div class="p-3 bg-light rounded-3 text-start">
              <div class="small text-muted mb-1">Equivalencia del total</div>
              <div class="small">💲 USD: $${order.total.toFixed(2)} &nbsp;|&nbsp; ₡ CRC: ${crc} &nbsp;|&nbsp; € EUR: ${eur} &nbsp;|&nbsp; MX$ MXN: ${mxn}</div>
            </div>`;
        }
      }
    } catch (err) {
      alert('❌ ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Confirmar pedido';
    }
  });
});
