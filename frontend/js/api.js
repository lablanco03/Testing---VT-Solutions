// Configuración central de la API
const API_BASE = 'http://localhost:3000/api';

// Helpers de sesión
const Auth = {
  save(data) {
    localStorage.setItem('vt_token', data.token);
    localStorage.setItem('vt_user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
  },
  token() { return localStorage.getItem('vt_token'); },
  user() {
    const u = localStorage.getItem('vt_user');
    return u ? JSON.parse(u) : null;
  },
  userId() {
    const u = Auth.user();
    return u ? u._id : null;
  },
  logout() {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
  },
  isLoggedIn() { return !!Auth.token(); }
};

// Wrapper fetch con token automático
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.token();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}
