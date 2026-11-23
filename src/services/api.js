import axios from "axios";

// El JWT vive solo en memoria. El navegador administra la cookie HttpOnly.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
  withCredentials: true,
  timeout: 15000,
});
export const marcaSalida = "ea3-sesion-cerrada";
let accessToken = null;
let csrfToken = null;
let csrfPendiente = null;
let renovacion = null;
let versionSesion = 0;
let salidaLocal = false;

// Las pestañas comparten la cookie. Se turnan para renovarla o cerrarla.
function conCookieSesion(accion) {
  return navigator.locks ? navigator.locks.request("ea3-cookie-sesion", accion) : accion();
}
export function iniciarSesion(correo, clave) {
  return conCookieSesion(async () => {
    await obtenerCsrf();
    return api.post("/auth/login", { correo, clave });
  });
}
export function cerrarSesionRemota() {
  return conCookieSesion(async () => {
    await obtenerCsrf();
    return api.post("/auth/logout");
  });
}

function salidaSolicitada() {
  try { return salidaLocal || localStorage.getItem(marcaSalida) === "si"; }
  catch { return salidaLocal; }
}
export function establecerToken(token) {
  versionSesion++;
  accessToken = token;
  if (token) {
    salidaLocal = false;
    try { localStorage.removeItem(marcaSalida); } catch { /* Memoria disponible. */ }
  }
}
export function cerrarSesionLocal() {
  versionSesion++;
  accessToken = null;
  salidaLocal = true;
  // Solo una preferencia, nunca una contraseña ni un JWT. Evita restaurar la
  // cookie al recargar si el servidor no recibió el cierre por falta de red.
  try { localStorage.setItem(marcaSalida, "si"); } catch { /* Se limpia la memoria igualmente. */ }
  window.dispatchEvent(new Event("sesion-vencida"));
}
export async function obtenerCsrf() {
  if (!csrfPendiente) csrfPendiente = api.get("/auth/csrf").then(({ data }) => {
    csrfToken = data.token;
    return csrfToken;
  }).finally(() => { csrfPendiente = null; });
  return csrfPendiente;
}
export async function renovarSesion() {
  if (salidaSolicitada()) throw new Error("La sesión fue cerrada.");
  // Comparte una renovación y descarta su respuesta si hubo un cierre de sesión.
  if (!renovacion) {
    const version = versionSesion;
    renovacion = conCookieSesion(async () => {
      if (version !== versionSesion || salidaSolicitada()) throw new Error("Sesión modificada.");
      // El servidor u otra pestaña pueden haber reemplazado la cookie CSRF.
      await obtenerCsrf();
      return api.post("/auth/refresh");
    }).then(({ data }) => {
      if (version !== versionSesion || salidaSolicitada()) throw new Error("Sesión modificada.");
      accessToken = data.accessToken;
      window.dispatchEvent(new CustomEvent("sesion-renovada", { detail: data.usuario }));
      return data.usuario;
    }).catch(error => {
      if (version === versionSesion) {
        accessToken = null;
        window.dispatchEvent(new Event("sesion-vencida"));
      }
      throw error;
    }).finally(() => { renovacion = null; });
  }
  return renovacion;
}
api.interceptors.request.use(async config => {
  // Estas rutas usan cookies/credenciales, no el JWT que puede estar vencido.
  const sinBearer = ["/auth/csrf", "/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].includes(config.url);
  if (accessToken && !sinBearer && !salidaSolicitada()) config.headers.Authorization = `Bearer ${accessToken}`;
  else delete config.headers.Authorization;
  if (!["get", "head", "options"].includes(config.method)) {
    if (!csrfToken) await obtenerCsrf();
    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  const permiteRenovar = config && (!config.url.startsWith("/auth/") || config.url === "/auth/me");
  if (error.response?.status === 401 && permiteRenovar && !config._reintento && !salidaSolicitada()) {
    config._reintento = true;
    if (!accessToken || config.headers.Authorization === `Bearer ${accessToken}`) await renovarSesion();
    return api(config);
  }
  throw error;
});
export function mensajeError(error) {
  return error.response?.data?.mensaje || (error.code === "ECONNABORTED"
    ? "El servidor demoró demasiado. Intenta nuevamente."
    : "No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.");
}
