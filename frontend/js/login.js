document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value;
    const btn      = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showAlert(form, 'Todos los campos son obligatorios', 'danger');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Iniciando...';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      Auth.save(data);
      showAlert(form, `¡Bienvenido, ${data.name}!`, 'success');
      setTimeout(() => window.location.href = 'principal.html', 800);
    } catch (err) {
      showAlert(form, err.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
    }
  });

  function showAlert(parent, msg, type) {
    let el = document.getElementById('vt-alert');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vt-alert';
      parent.prepend(el);
    }
    el.className = `alert alert-${type} py-2 text-center`;
    el.textContent = msg;
  }
});
