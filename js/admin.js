// ==========================================================
// CONFIGURACIÓN — cambia esto por tu correo real
// ==========================================================
const ADMIN_EMAIL = "misaelcrisantobarranzuela@gmail.com";

const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  await window.firebaseSignOutAdmin();
  window.location.href = "login.html";
});

function iniciarAdminConFirebase() {
  window.firebaseOnAdminAuthChange((user) => {
    if (user && user.email === ADMIN_EMAIL) {
      dashboard.hidden = false;
      cargarTodo();
    } else {
      // No hay sesión válida de admin — regresa al login
      window.location.href = "login.html";
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (window.firebaseReady) {
    iniciarAdminConFirebase();
  } else {
    window.addEventListener("firebaseReady", iniciarAdminConFirebase);
  }
});

// ==========================================================
// CARGA GENERAL
// ==========================================================
function cargarTodo() {
  cargarReservas();
  cargarResenasAdmin();
  cargarPreciosAdmin();
}

// ==========================================================
// SELECTOR DE MES
// ==========================================================
let mesSeleccionado = new Date();
mesSeleccionado.setDate(1);

const mesLabel = document.getElementById("mesLabel");
const nombresMeses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function actualizarMesLabel() {
  mesLabel.textContent = `${nombresMeses[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}`;
}

document.getElementById("mesAnterior").addEventListener("click", () => {
  mesSeleccionado.setMonth(mesSeleccionado.getMonth() - 1);
  actualizarMesLabel();
  cargarReservas();
});
document.getElementById("mesSiguiente").addEventListener("click", () => {
  mesSeleccionado.setMonth(mesSeleccionado.getMonth() + 1);
  actualizarMesLabel();
  cargarReservas();
});
actualizarMesLabel();

// ==========================================================
// RESERVAS
// ==========================================================
async function cargarReservas() {
  const q = window.firebaseQuery(
    window.firebaseCollection(window.firebaseAdminDb, "reservas"),
    window.firebaseOrderBy("creado", "desc")
  );
  const snapshot = await window.firebaseGetDocs(q);

  const pendientesEl = document.getElementById("listaPendientes");
  const historialEl = document.getElementById("listaHistorial");
  pendientesEl.innerHTML = "";
  historialEl.innerHTML = "";

  let pendientes = 0, estaSemana = 0, delMesSeleccionado = 0, total = 0;
  const ahora = new Date();
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const inicioMesSel = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
  const finMesSel = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 1);

  let hayPendientes = false, hayHistorial = false;

  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    const id = docSnap.id;
    const fechaCreado = new Date(r.creado);
    total++;
    if (fechaCreado >= inicioSemana) estaSemana++;
    if (fechaCreado >= inicioMesSel && fechaCreado < finMesSel) delMesSeleccionado++;

    if (r.estado === "pendiente") {
      pendientes++;
      hayPendientes = true;
      pendientesEl.appendChild(filaReserva(id, r, true));
    } else {
      hayHistorial = true;
      historialEl.appendChild(filaReserva(id, r, false));
    }
  });

  if (!hayPendientes) pendientesEl.innerHTML = '<p class="admin-empty">No hay reservas pendientes.</p>';
  if (!hayHistorial) historialEl.innerHTML = '<p class="admin-empty">Aún no hay historial.</p>';

  document.getElementById("statPendientes").textContent = pendientes;
  document.getElementById("statSemana").textContent = estaSemana;
  document.getElementById("statMes").textContent = delMesSeleccionado;
  document.getElementById("statMesLabel").textContent =
    nombresMeses[mesSeleccionado.getMonth()].charAt(0).toUpperCase() + nombresMeses[mesSeleccionado.getMonth()].slice(1);
  document.getElementById("statTotal").textContent = total;
}

function filaReserva(id, r, esPendiente) {
  const row = document.createElement("div");
  row.className = "admin-row";

  const badgeClase = r.estado === "confirmada" ? "badge--confirmada" : r.estado === "cancelada" ? "badge--cancelada" : "badge--pendiente";

  let horarioTexto = r.fecha || "";
  if (r.horaInicio && r.horaFin) {
    const inicio = new Date(r.horaInicio);
    const fin = new Date(r.horaFin);
    const duracion = Math.round((fin - inicio) / (1000 * 60 * 60) * 10) / 10;
    const opcionesFecha = { day: "2-digit", month: "2-digit", year: "numeric" };
    const opcionesHora = { hour: "numeric", minute: "2-digit" };
    horarioTexto = `${inicio.toLocaleDateString("es-PE", opcionesFecha)} · ${inicio.toLocaleTimeString("es-PE", opcionesHora)} a ${fin.toLocaleTimeString("es-PE", opcionesHora)} (${duracion} ${duracion === 1 ? "hora" : "horas"})`;
  }

  row.innerHTML = `
    <div class="admin-row__info">
      <strong>${escaparHTML(r.nombre || "Sin nombre")}</strong>
      <span>${escaparHTML(r.celular || "Sin celular")}</span>
      <span>${escaparHTML(horarioTexto)}</span>
      <span class="badge ${badgeClase}">${r.estado}</span>
    </div>
    <div class="admin-row__actions"></div>
  `;

  const actions = row.querySelector(".admin-row__actions");

  if (esPendiente) {
    const btnConfirmar = document.createElement("button");
    btnConfirmar.className = "btn btn--primary btn--small";
    btnConfirmar.textContent = "Confirmar";
    btnConfirmar.addEventListener("click", () => actualizarEstado(id, "confirmada"));

    const btnCancelar = document.createElement("button");
    btnCancelar.className = "btn btn--danger btn--small";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.addEventListener("click", () => actualizarEstado(id, "cancelada"));

    actions.appendChild(btnConfirmar);
    actions.appendChild(btnCancelar);
  } else {
    actions.appendChild(crearBotonEliminarConConfirmacion(async () => {
      await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseAdminDb, "reservas", id));
      cargarReservas();
    }));
  }

  return row;
}

// Botón de eliminar con confirmación dentro de la misma tarjeta (sin ventanas emergentes).
// Al hacer clic, se reemplaza por "¿Seguro? Sí / No" en el mismo lugar.
function crearBotonEliminarConConfirmacion(onConfirmar) {
  const contenedor = document.createElement("span");

  function mostrarBotonInicial() {
    contenedor.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--danger btn--small";
    btn.textContent = "Eliminar";
    btn.addEventListener("click", mostrarConfirmacion);
    contenedor.appendChild(btn);
  }

  function mostrarConfirmacion() {
    contenedor.innerHTML = "";
    const texto = document.createElement("span");
    texto.className = "confirm-inline__texto";
    texto.textContent = "¿Seguro? ";

    const btnSi = document.createElement("button");
    btnSi.type = "button";
    btnSi.className = "btn btn--danger btn--small";
    btnSi.textContent = "Sí, eliminar";
    btnSi.addEventListener("click", onConfirmar);

    const btnNo = document.createElement("button");
    btnNo.type = "button";
    btnNo.className = "btn btn--outline btn--small";
    btnNo.textContent = "No";
    btnNo.addEventListener("click", mostrarBotonInicial);

    contenedor.appendChild(texto);
    contenedor.appendChild(btnSi);
    contenedor.appendChild(btnNo);
  }

  mostrarBotonInicial();
  return contenedor;
}

async function actualizarEstado(id, nuevoEstado) {
  const ref = window.firebaseDoc(window.firebaseAdminDb, "reservas", id);
  await window.firebaseUpdateDoc(ref, { estado: nuevoEstado });
  cargarReservas();
}

// ==========================================================
// PRECIOS
// ==========================================================
async function cargarPreciosAdmin() {
  const ref = window.firebaseDoc(window.firebaseAdminDb, "precios", "general");
  const snap = await window.firebaseGetDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("inputPrecioHora").value = data.precioHora || "";
    document.getElementById("inputPrecioDia").value = data.precioDia || "";
  }
}

document.getElementById("preciosForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const precioHora = Number(document.getElementById("inputPrecioHora").value);
  const precioDia = Number(document.getElementById("inputPrecioDia").value);

  const ref = window.firebaseDoc(window.firebaseAdminDb, "precios", "general");
  await window.firebaseSetDoc(ref, { precioHora, precioDia });

  const aviso = document.getElementById("preciosGuardado");
  aviso.hidden = false;
  setTimeout(() => (aviso.hidden = true), 2500);
});

// ==========================================================
// RESEÑAS
// ==========================================================
async function cargarResenasAdmin() {
  const q = window.firebaseQuery(
    window.firebaseCollection(window.firebaseAdminDb, "resenas"),
    window.firebaseOrderBy("fecha", "desc")
  );
  const snapshot = await window.firebaseGetDocs(q);
  const lista = document.getElementById("listaResenasAdmin");
  lista.innerHTML = "";

  if (snapshot.empty) {
    lista.innerHTML = '<p class="admin-empty">Aún no hay reseñas.</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row__info">
        <strong>${escaparHTML(r.nombre || "Huésped")}</strong>
        <span>${"★".repeat(r.calificacion)}${"☆".repeat(5 - r.calificacion)}</span>
        <span>${escaparHTML(r.comentario)}</span>
      </div>
      <div class="admin-row__actions"></div>
    `;
    const btnBorrar = crearBotonEliminarConConfirmacion(async () => {
      await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseAdminDb, "resenas", docSnap.id));
      cargarResenasAdmin();
    });
    row.querySelector(".admin-row__actions").appendChild(btnBorrar);
    lista.appendChild(row);
  });
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}