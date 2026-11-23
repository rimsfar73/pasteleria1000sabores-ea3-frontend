import { useEffect, useState } from "react";
import { ContextoUsuarios } from "../context/contextoUsuarios.js";
import { api, establecerToken, renovarSesion, mensajeError, cerrarSesionLocal, cerrarSesionRemota, iniciarSesion, marcaSalida } from "../services/api";

export function UsuariosProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorPersistencia, setError] = useState("");

  useEffect(() => {
    const renovada = e => setSesion(e.detail);
    const vencida = () => { setSesion(null); setUsuarios([]); };
    const otraPestana = e => { if (e.key === marcaSalida && e.newValue === "si") cerrarSesionLocal(); };
    window.addEventListener("storage", otraPestana);
    window.addEventListener("sesion-renovada", renovada);
    window.addEventListener("sesion-vencida", vencida);
    renovarSesion().catch(() => {}).finally(() => setCargando(false));
    return () => { window.removeEventListener("storage", otraPestana); window.removeEventListener("sesion-renovada", renovada); window.removeEventListener("sesion-vencida", vencida); };
  }, []);

  useEffect(() => {
    let activo = true;
    if (!sesion) return;
    if (sesion.rol === "admin") {
      api.get("/usuarios").then(({data}) => { if (activo) setUsuarios(data); })
        .catch(e => { if (activo) setError(mensajeError(e)); });
    } else Promise.resolve().then(() => { if (activo) setUsuarios([sesion]); });
    return () => { activo = false; };
  }, [sesion]);

  async function ejecutar(operacion) {
    try { setError(""); const usuario = await operacion(); return { ok: true, usuario }; }
    catch (e) { const mensaje = mensajeError(e); setError(mensaje); return { ok: false, mensaje, errores: e.response?.data?.errores || {} }; }
  }
  function crear(datos, { desdeAdmin = false } = {}) {
    return ejecutar(async () => {
      const { data } = await api.post(desdeAdmin ? "/usuarios" : "/auth/register", datos);
      if (desdeAdmin) setUsuarios(lista => [...lista, data]);
      return data;
    });
  }
  function actualizar(id, datos) {
    return ejecutar(async () => {
      const { data } = await api.put(`/usuarios/${id}`, datos);
      setUsuarios(lista => lista.map(u => u.id === id ? data : u));
      if (id === sesion?.id) {
        if (datos.clave || data.rol !== sesion.rol) await salir();
        else await renovarSesion();
      }
      return data;
    });
  }
  function actualizarMiPerfil(datos) {
    return ejecutar(async () => { const { data } = await api.put("/perfil", datos); if (datos.clave) await salir(); else await renovarSesion(); return data; });
  }
  async function eliminar(id) {
    const resultado = await ejecutar(async () => { await api.delete(`/usuarios/${id}`); setUsuarios(lista => lista.filter(u => u.id !== id)); });
    return resultado.ok;
  }
  function ingresar(correo, clave) {
    return ejecutar(async () => {
      const { data } = await iniciarSesion(correo, clave);
      establecerToken(data.accessToken); setSesion(data.usuario); return data.usuario;
    });
  }
  async function salir() {
    cerrarSesionLocal(); setSesion(null); setUsuarios([]);
    try { await cerrarSesionRemota(); }
    catch { setError("Sesión cerrada en este navegador. No se pudo confirmar el cierre en el servidor; vuelve a iniciar sesión cuando haya conexión."); }
    return true;
  }
  return <ContextoUsuarios.Provider value={{ sesion, usuarios, cargando, errorPersistencia, crear, actualizar, actualizarMiPerfil, eliminar, ingresar, salir }}>{children}</ContextoUsuarios.Provider>;
}
