document.addEventListener('DOMContentLoaded', async function () {
  const grid        = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');
  const ratesEl     = document.getElementById('exchange-rates');

  let allProducts = [];

  // ── Cargar productos desde el backend ────────────────────────────────────
  async function loadProducts() {
    grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';
    try {
      allProducts = await apiFetch('/products');
      renderProducts(allProducts);
    } catch (err) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">No se pudieron cargar los productos: ${err.message}</div></div>`;
    }
  }

  // ── Renderizar grid ───────────────────────────────────────────────────────
  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron productos.</div>';
      return;
    }
    grid.innerHTML = products.map(p => {
      const img = p.image
        ? p.image
        : `https://picsum.photos/seed/${p._id}/400/300`;
      const cat = p.category?.name || '';
      return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card h-100 shadow-sm product-card">
            <img src="${img}" class="card-img-top" alt="${p.name}" style="height:200px;object-fit:cover;"
                 onerror="this.src='https://picsum.photos/seed/${p._id}/400/300'">
            <div class="card-body d-flex flex-column">
              ${cat ? `<span class="badge bg-secondary mb-1">${cat}</span>` : ''}
              <h5 class="card-title">${p.name}</h5>
              <p class="card-text text-muted small">${p.description || ''}</p>
              <p class="card-text fw-bold text-primary">$${parseFloat(p.price).toFixed(2)}</p>
              <button class="btn btn-primary mt-auto" onclick="addToCart('${p._id}', '${p.name}')">
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Agregar al carrito ────────────────────────────────────────────────────
  window.addToCart = async function (productId, productName) {
    const userId = Auth.userId();
    if (!userId) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      window.location.href = 'Login.html';
      return;
    }
    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ userId, productId, quantity: 1 })
      });
      showToast(`✅ "${productName}" agregado al carrito`);
    } catch (err) {
      showToast('❌ ' + err.message, true);
    }
  };

  // ── Búsqueda local ────────────────────────────────────────────────────────
  function filterProducts() {
    const q = searchInput.value.toLowerCase().trim();
    renderProducts(q ? allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) : allProducts);
  }
  searchBtn.addEventListener('click', filterProducts);
  searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') filterProducts(); });

  // ── API externa: tasas de cambio ──────────────────────────────────────────
  async function loadRates() {
    if (!ratesEl) return;
    try {
      const data = await apiFetch('/external/rates');
      ratesEl.innerHTML = `
        <span class="me-3">💱 Tasas (USD): </span>
        <span class="me-2">CRC: ${data.rates.CRC?.toFixed(0)}</span>
        <span class="me-2">EUR: ${data.rates.EUR?.toFixed(4)}</span>
        <span>MXN: ${data.rates.MXN?.toFixed(2)}</span>`;
    } catch {
      ratesEl.innerHTML = '';
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg, error = false) {
    let t = document.getElementById('vt-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'vt-toast';
      t.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;min-width:220px;';
      document.body.appendChild(t);
    }
    t.innerHTML = `<div class="alert alert-${error ? 'danger' : 'success'} shadow py-2 mb-0">${msg}</div>`;
    setTimeout(() => { t.innerHTML = ''; }, 2500);
  }

  await loadProducts();
  await loadRates();
});
