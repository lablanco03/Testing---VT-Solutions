document.addEventListener('DOMContentLoaded', function () {
  const registroForm = document.getElementById('registroForm');
  if (!registroForm) return;

  // ── Validación en vivo ────────────────────────────────────────────────────
  function crearMensaje(inputId) {
    const input   = document.getElementById(inputId);
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-validacion';
    mensaje.style.cssText = 'font-size:0.85rem;margin-top:5px;min-height:20px;display:none;';
    input.parentNode.appendChild(mensaje);
    return mensaje;
  }

  const mensajes = {
    nombre:  crearMensaje('nombre'),
    correo:  crearMensaje('correo'),
    password:crearMensaje('password'),
    confirm: crearMensaje('confirmPassword')
  };

  function validarCampo(campoId, reglas, ok) {
    const input = document.getElementById(campoId);
    const val   = input.value.trim ? input.value.trim() : input.value;
    const div   = mensajes[campoId] || mensajes.confirm;
    if (!val) { input.classList.remove('is-invalid','is-valid'); div.style.display='none'; return false; }
    for (const r of reglas) {
      if (r.condicion) {
        input.classList.add('is-invalid'); input.classList.remove('is-valid');
        div.style.display='block'; div.innerHTML=r.mensaje; div.style.color='#dc3545'; return false;
      }
    }
    input.classList.add('is-valid'); input.classList.remove('is-invalid');
    div.style.display='block'; div.innerHTML=ok; div.style.color='#28a745'; return true;
  }

  function validarConfirmacion() {
    const p = document.getElementById('password').value;
    const c = document.getElementById('confirmPassword').value;
    const div = mensajes.confirm;
    const input = document.getElementById('confirmPassword');
    if (!c) { input.classList.remove('is-invalid','is-valid'); div.style.display='none'; return false; }
    if (c !== p) {
      input.classList.add('is-invalid'); input.classList.remove('is-valid');
      div.style.display='block'; div.innerHTML='❌ Las contraseñas no coinciden'; div.style.color='#dc3545'; return false;
    }
    input.classList.add('is-valid'); input.classList.remove('is-invalid');
    div.style.display='block'; div.innerHTML='✅ Las contraseñas coinciden'; div.style.color='#28a745'; return true;
  }

  document.getElementById('nombre').addEventListener('input', function () {
    validarCampo('nombre', [
      { condicion: this.value.trim().length < 3, mensaje: '❌ Mínimo 3 caracteres' },
      { condicion: !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.value.trim()), mensaje: '❌ Solo letras' }
    ], '✅ Nombre válido');
  });
  document.getElementById('correo').addEventListener('input', function () {
    validarCampo('correo', [
      { condicion: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim()), mensaje: '❌ Correo inválido' }
    ], '✅ Correo válido');
  });
  document.getElementById('password').addEventListener('input', function () {
    validarCampo('password', [
      { condicion: this.value.length < 6, mensaje: '❌ Mínimo 6 caracteres' },
      { condicion: !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(this.value), mensaje: '❌ Debe tener mayúscula, minúscula y número' }
    ], '✅ Contraseña segura');
    if (document.getElementById('confirmPassword').value) validarConfirmacion();
  });
  document.getElementById('confirmPassword').addEventListener('input', validarConfirmacion);

  // ── Submit: llamada real al backend ──────────────────────────────────────
  registroForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre   = document.getElementById('nombre').value.trim();
    const correo   = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirmPassword').value;

    const v1 = validarCampo('nombre', [
      { condicion: nombre.length < 3, mensaje: '❌ Mínimo 3 caracteres' },
      { condicion: !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre), mensaje: '❌ Solo letras' }
    ], '✅ Nombre válido');
    const v2 = validarCampo('correo', [
      { condicion: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo), mensaje: '❌ Correo inválido' }
    ], '✅ Correo válido');
    const v3 = validarCampo('password', [
      { condicion: password.length < 6, mensaje: '❌ Mínimo 6 caracteres' },
      { condicion: !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password), mensaje: '❌ Mayúscula, minúscula y número' }
    ], '✅ Contraseña segura');
    const v4 = validarConfirmacion();

    if (!v1 || !v2 || !v3 || !v4) return;

    const btn = registroForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: nombre, email: correo, password })
      });

      Auth.save(data);
      showAlert('✅ ¡Registro exitoso! Redirigiendo...', 'success');
      setTimeout(() => window.location.href = 'principal.html', 1200);
    } catch (err) {
      showAlert('❌ ' + err.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Registrarse';
    }
  });

  function showAlert(msg, type) {
    let el = document.getElementById('vt-alert');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vt-alert';
      registroForm.prepend(el);
    }
    el.className = `alert alert-${type} py-2 text-center`;
    el.textContent = msg;
  }
});
