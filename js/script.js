// ==========================================================
// CONFIGURACIÓN RÁPIDA — edita estos valores
// ==========================================================
const NUMERO_WHATSAPP = "51921023521";
let PRECIO_POR_HORA = 40; // TODO: precio real (se puede sobreescribir desde el panel admin)
let PRECIO_POR_DIA = 150; // TODO: precio real (se puede sobreescribir desde el panel admin)

document.getElementById("precioHora").textContent = PRECIO_POR_HORA;
document.getElementById("precioDia").textContent = PRECIO_POR_DIA;

// Si el admin ya guardó precios en Firestore, los usamos en vez de los valores por defecto de arriba.
async function cargarPreciosDesdeFirebase() {
  if (!window.firebaseDb) return;
  try {
    const ref = window.firebaseDoc(window.firebaseDb, "precios", "general");
    const snap = await window.firebaseGetDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.precioHora) {
        PRECIO_POR_HORA = data.precioHora;
        document.getElementById("precioHora").textContent = PRECIO_POR_HORA;
      }
      if (data.precioDia) {
        PRECIO_POR_DIA = data.precioDia;
        document.getElementById("precioDia").textContent = PRECIO_POR_DIA;
      }
    }
  } catch (err) {
    console.warn("No se pudieron cargar precios personalizados, se usan los valores por defecto:", err);
  }
}

// ==========================================================
// LIGHTBOX (ver foto de la galería en grande)
// ==========================================================
const lightboxOverlay = document.getElementById("lightboxOverlay");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightbox = document.getElementById("closeLightbox");

document.querySelectorAll(".gallery__item img").forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxOverlay.classList.add("is-open");
  });
});

closeLightbox.addEventListener("click", () => lightboxOverlay.classList.remove("is-open"));
lightboxOverlay.addEventListener("click", (e) => {
  if (e.target === lightboxOverlay) lightboxOverlay.classList.remove("is-open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") lightboxOverlay.classList.remove("is-open");
});
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");
const menuIcon = document.getElementById("menuIcon");
const menuCuenta = document.getElementById("menuCuenta");
const menuNombreUsuario = document.getElementById("menuNombreUsuario");
const menuCerrarSesion = document.getElementById("menuCerrarSesion");

menuToggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", isOpen);
  menuIcon.textContent = isOpen ? "close" : "menu";
});

document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", () => {
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", false);
    menuIcon.textContent = "menu";
  });
});

// ==========================================================
// BOTÓN WHATSAPP (siempre visible, mensaje genérico)
// ==========================================================
const whatsappFloat = document.getElementById("whatsappFloat");
whatsappFloat.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Vi el departamento en la web y me gustaría más información...")}`;

// ==========================================================
// LOGIN CON GOOGLE (login diferido)
// ==========================================================
const authBox = document.getElementById("authBox");
const calendarWrap = document.getElementById("calendarWrap");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const dejarResenaBtn = document.getElementById("dejarResenaBtn");

let usuarioActual = null;

googleLoginBtn.addEventListener("click", async () => {
  try {
    const result = await window.firebaseSignIn();
    usuarioActual = result.user;
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    alert("No se pudo iniciar sesión. Intenta de nuevo.");
  }
});

const resenaForm = document.getElementById("resenaForm");
const resenaModalOverlay = document.getElementById("resenaModalOverlay");
const closeResenaModal = document.getElementById("closeResenaModal");
const starPicker = document.getElementById("starPicker");
const calificacionInput = document.getElementById("calificacionSeleccionada");

function abrirModal(overlay) { overlay.classList.add("is-open"); }
function cerrarModal(overlay) { overlay.classList.remove("is-open"); }

dejarResenaBtn.addEventListener("click", () => {
  if (!usuarioActual) {
    document.getElementById("reservar").scrollIntoView({ behavior: "smooth" });
    return;
  }
  abrirModal(resenaModalOverlay);
});

closeResenaModal.addEventListener("click", () => cerrarModal(resenaModalOverlay));
resenaModalOverlay.addEventListener("click", (e) => {
  if (e.target === resenaModalOverlay) cerrarModal(resenaModalOverlay);
});

// Selección de estrellas (clic)
starPicker.querySelectorAll(".star").forEach(star => {
  star.addEventListener("click", () => {
    const valor = Number(star.dataset.value);
    calificacionInput.value = valor;
    starPicker.querySelectorAll(".star").forEach(s => {
      s.classList.toggle("is-active", Number(s.dataset.value) <= valor);
    });
  });
});

resenaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const calificacion = Number(calificacionInput.value);
  const comentario = document.getElementById("comentarioResena").value.trim();

  if (calificacion === 0) {
    resenaForm.querySelector("h3").insertAdjacentHTML(
      "afterend",
      '<p class="form-hint" style="color:#c0392b;font-size:0.85rem;">Selecciona al menos una estrella.</p>'
    );
    return;
  }

  await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, "resenas"), {
    uid: usuarioActual.uid,
    nombre: usuarioActual.displayName,
    comentario,
    calificacion,
    fecha: new Date().toISOString()
  });

  resenaForm.reset();
  calificacionInput.value = 0;
  starPicker.querySelectorAll(".star").forEach(s => s.classList.remove("is-active"));
  cerrarModal(resenaModalOverlay);
  cargarResenas();
});

// Escucha cambios de sesión — espera a que firebase-config.js avise que ya está listo
function iniciarConFirebase() {
  window.firebaseOnAuthChange((user) => {
    usuarioActual = user;
    if (user) {
      authBox.hidden = true;
      calendarWrap.hidden = false;
      initCalendar();

      menuCuenta.hidden = false;
      menuMisReservas.hidden = false;
      menuNombreUsuario.textContent = user.displayName || user.email;
    } else {
      authBox.hidden = false;
      calendarWrap.hidden = true;
      menuCuenta.hidden = true;
      menuMisReservas.hidden = true;
    }
  });
  cargarResenas();
  cargarPreciosDesdeFirebase();
}

menuCerrarSesion.addEventListener("click", () => {
  window.firebaseSignOut();
  menu.classList.remove("is-open"); // cierra el menú para que se note el cambio al instante
  menuIcon.textContent = "menu";
});

// ==========================================================
// MIS RESERVAS (historial del propio usuario)
// ==========================================================
const misReservasModalOverlay = document.getElementById("misReservasModalOverlay");
const closeMisReservasModal = document.getElementById("closeMisReservasModal");
const listaMisReservas = document.getElementById("listaMisReservas");
const menuMisReservas = document.getElementById("menuMisReservas");

menuMisReservas.addEventListener("click", async (e) => {
  e.preventDefault();
  menu.classList.remove("is-open");
  menuIcon.textContent = "menu";
  abrirModal(misReservasModalOverlay);
  await cargarMisReservas();
});

closeMisReservasModal.addEventListener("click", () => cerrarModal(misReservasModalOverlay));
misReservasModalOverlay.addEventListener("click", (e) => {
  if (e.target === misReservasModalOverlay) cerrarModal(misReservasModalOverlay);
});

async function cargarMisReservas() {
  if (!usuarioActual) return;
  listaMisReservas.innerHTML = '<p class="admin-empty">Cargando...</p>';

  const snapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDb, "reservas"));
  const propias = [];
  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    if (r.uid === usuarioActual.uid) propias.push(r);
  });
  propias.sort((a, b) => new Date(b.creado) - new Date(a.creado));

  if (propias.length === 0) {
    listaMisReservas.innerHTML = '<p class="admin-empty">Aún no tienes reservas.</p>';
    return;
  }

  listaMisReservas.innerHTML = "";
  propias.forEach(r => {
    const badgeClase = r.estado === "confirmada" ? "badge--confirmada" : r.estado === "cancelada" ? "badge--cancelada" : "badge--pendiente";
    let horarioTexto = r.fecha || "";
    if (r.horaInicio && r.horaFin) {
      const inicio = new Date(r.horaInicio);
      const fin = new Date(r.horaFin);
      const opcionesFecha = { day: "2-digit", month: "2-digit", year: "numeric" };
      const opcionesHora = { hour: "numeric", minute: "2-digit" };
      horarioTexto = `${inicio.toLocaleDateString("es-PE", opcionesFecha)} · ${inicio.toLocaleTimeString("es-PE", opcionesHora)} a ${fin.toLocaleTimeString("es-PE", opcionesHora)}`;
    }
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row__info">
        <span>${horarioTexto}</span>
        <span class="badge ${badgeClase}">${r.estado}</span>
      </div>
    `;
    listaMisReservas.appendChild(row);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (window.firebaseReady) {
    iniciarConFirebase();
  } else {
    window.addEventListener("firebaseReady", iniciarConFirebase);
  }
});

// ==========================================================
// CALENDARIO (FullCalendar) — vista semanal
// ==========================================================
let calendarInicializado = false;

function initCalendar() {
  if (calendarInicializado) return;
  calendarInicializado = true;

  const calendarEl = document.getElementById("calendar");
  const ahora = new Date();
  const hoyStr = ahora.toISOString().split("T")[0];
  const esMovil = () => window.matchMedia("(max-width: 640px)").matches;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: esMovil() ? "timeGridThreeDay" : "timeGridSieteDias",
    views: {
      timeGridThreeDay: { type: "timeGrid", duration: { days: 3 }, buttonText: "3 días" },
      // Duración personalizada (no "semana" del calendario): siempre arranca en el día de hoy,
      // nunca muestra días anteriores al actual.
      timeGridSieteDias: { type: "timeGrid", duration: { days: 7 }, buttonText: "7 días" }
    },
    locale: "es",
    height: "auto",
    allDaySlot: false,
    nowIndicator: true,
    validRange: { start: hoyStr },
    slotMinTime: "08:00:00",
    slotMaxTime: "23:00:00",
    slotLabelFormat: { hour: "numeric", minute: "2-digit", meridiem: "short" },
    eventTimeFormat: { hour: "numeric", minute: "2-digit", meridiem: "short" },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },
    windowResize: function () {
      calendar.changeView(esMovil() ? "timeGridThreeDay" : "timeGridSieteDias");
    },
    selectable: true,
    selectOverlap: false, // no deja seleccionar encima de un horario ya ocupado
    eventOverlap: false,
    selectAllow: function (selectInfo) {
      return selectInfo.start >= ahora; // no permite seleccionar horas ya pasadas hoy
    },
    events: async function (info, successCallback) {
      const eventos = await cargarReservasComoEventos();
      successCallback(eventos);
    },
    select: function (info) {
      abrirResumenReserva(info.start, info.end);
    }
  });
  calendar.render();
  window.calendarInstance = calendar; // para poder refrescar los eventos tras reservar
}

// Trae las reservas pendientes/confirmadas de Firestore y las convierte en
// eventos "Ocupado" (bloquean esa franja para que nadie más la seleccione).
async function cargarReservasComoEventos() {
  if (!window.firebaseDb) return [];
  try {
    const snapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDb, "reservas"));
    const eventos = [];
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      if (r.estado === "cancelada") return; // las canceladas liberan el horario
      eventos.push({
        title: "Ocupado",
        start: r.horaInicio || r.fecha,
        end: r.horaFin,
        color: r.estado === "confirmada" ? "#c0392b" : "#CBA135",
        display: "block"
      });
    });
    return eventos;
  } catch (err) {
    console.warn("No se pudieron cargar las reservas existentes:", err);
    return [];
  }
}

// ==========================================================
// FORMULARIO DE RESERVA
// ==========================================================
const reservaModalOverlay = document.getElementById("reservaModalOverlay");
const closeReservaModal = document.getElementById("closeReservaModal");
const resumenReserva = document.getElementById("resumenReserva");

closeReservaModal.addEventListener("click", () => cerrarModal(reservaModalOverlay));
reservaModalOverlay.addEventListener("click", (e) => {
  if (e.target === reservaModalOverlay) cerrarModal(reservaModalOverlay);
});

function abrirResumenReserva(start, end) {
  const opcionesFecha = { weekday: "long", day: "numeric", month: "long" };
  const opcionesHora = { hour: "numeric", minute: "2-digit" };
  const fechaTexto = start.toLocaleDateString("es-PE", opcionesFecha);
  const horaInicioTexto = start.toLocaleTimeString("es-PE", opcionesHora);
  const horaFinTexto = end.toLocaleTimeString("es-PE", opcionesHora);
  const duracionHoras = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;

  resumenReserva.textContent =
    `${fechaTexto}, de ${horaInicioTexto} a ${horaFinTexto} ` +
    `(${duracionHoras} ${duracionHoras === 1 ? "hora" : "horas"})`;

  document.getElementById("fechaSeleccionada").value = start.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  document.getElementById("horaInicioSeleccionada").value = start.toISOString();
  document.getElementById("horaFinSeleccionada").value = end.toISOString();
  document.getElementById("nombreCompleto").value = usuarioActual?.displayName || "";

  abrirModal(reservaModalOverlay);
}

document.getElementById("reservaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!usuarioActual) return;

  const fecha = document.getElementById("fechaSeleccionada").value;
  const horaInicio = document.getElementById("horaInicioSeleccionada").value;
  const horaFin = document.getElementById("horaFinSeleccionada").value;
  const nombre = document.getElementById("nombreCompleto").value.trim();
  const celular = document.getElementById("celular").value.trim();

  await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, "reservas"), {
    uid: usuarioActual.uid,
    nombre,
    celular,
    fecha,
    horaInicio,
    horaFin,
    estado: "pendiente",
    creado: new Date().toISOString()
  });

  cerrarModal(reservaModalOverlay);
  if (window.calendarInstance) window.calendarInstance.refetchEvents();

  const mensaje = `Hola, soy ${nombre} (cel. ${celular}). Quiero reservar el departamento el ${resumenReserva.textContent}.`;
  window.location.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
});

// ==========================================================
// RESEÑAS — mostrarlas desde Firestore
// ==========================================================
const RESENAS_VISIBLES_INICIAL = 4;
const verMasBtn = document.getElementById("verMasResenas");

async function cargarResenas() {
  if (!window.firebaseDb) return;
  const lista = document.getElementById("listaResenas");
  const q = window.firebaseQuery(
    window.firebaseCollection(window.firebaseDb, "resenas"),
    window.firebaseOrderBy("fecha", "desc")
  );
  const snapshot = await window.firebaseGetDocs(q);

  if (snapshot.empty) return; // se queda el mensaje "Aún no hay reseñas"

  lista.innerHTML = "";
  let index = 0;
  snapshot.forEach(doc => {
    const r = doc.data();
    const card = document.createElement("div");
    card.className = "review-card";
    if (index >= RESENAS_VISIBLES_INICIAL) card.classList.add("is-hidden-extra");

    card.innerHTML = `
      <span class="review-card__stars">${"★".repeat(r.calificacion)}${"☆".repeat(5 - r.calificacion)}</span>
      <span class="review-card__name">${escaparHTML(r.nombre || "Huésped")}</span>
      <p class="review-card__text">${escaparHTML(r.comentario)}</p>
    `;
    lista.appendChild(card);
    index++;
  });

  verMasBtn.hidden = index <= RESENAS_VISIBLES_INICIAL;
}

verMasBtn.addEventListener("click", () => {
  document.querySelectorAll(".review-card.is-hidden-extra").forEach(card => {
    card.classList.remove("is-hidden-extra");
  });
  verMasBtn.hidden = true;
});

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}