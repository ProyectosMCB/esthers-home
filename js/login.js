const ADMIN_EMAIL = "misaelcrisantobarranzuela@gmail.com";

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    const result = await window.firebaseSignInAdmin(email, password);
    if (result.user.email !== ADMIN_EMAIL) {
      await window.firebaseSignOutAdmin();
      loginError.textContent = "Esta cuenta no tiene permisos de administrador.";
      loginError.hidden = false;
      return;
    }
    window.location.href = "admin.html";
  } catch (err) {
    console.error("Error de login admin:", err.code, err.message);
    loginError.textContent = `Error: ${err.code || err.message}`;
    loginError.hidden = false;
  }
});

// Si ya hay una sesión de admin activa, pasa directo al panel
function revisarSesionExistente() {
  window.firebaseOnAdminAuthChange((user) => {
    if (user && user.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (window.firebaseReady) revisarSesionExistente();
  else window.addEventListener("firebaseReady", revisarSesionExistente);
});