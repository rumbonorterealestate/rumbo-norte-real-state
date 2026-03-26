/* =============================================
   AUTH — Login / Logout / Guard
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const sb = window.supabaseClient;

  // --- Auth guard: si estamos en admin.html, verificar sesión ---
  const isAdminPage = window.location.pathname.includes('admin.html');
  const isLoginPage = window.location.pathname.includes('login.html');

  const { data: { user } } = await sb.auth.getUser();

  if (isLoginPage && user) {
    window.location.href = 'admin.html';
    return;
  }

  if (isAdminPage && !user) {
    window.location.href = 'login.html';
    return;
  }

  // --- Login form ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');
      errorEl.style.display = 'none';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        errorEl.textContent = 'Introduce email y contraseña';
        errorEl.style.display = 'block';
        return;
      }

      btn.textContent = 'Accediendo...';
      btn.disabled = true;

      const { error } = await sb.auth.signInWithPassword({ email, password });

      if (error) {
        errorEl.textContent = 'Credenciales incorrectas';
        errorEl.style.display = 'block';
        btn.textContent = 'Iniciar sesión';
        btn.disabled = false;
        return;
      }

      window.location.href = 'admin.html';
    });
  }

  // --- Logout ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      window.location.href = 'login.html';
    });
  }
});
