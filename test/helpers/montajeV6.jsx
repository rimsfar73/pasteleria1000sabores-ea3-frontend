import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ContextoUsuarios } from "../../src/context/contextoUsuarios.js";

/** Utilidades compartidas para pruebas de REGRESIÓN EA2/EA3.
 * No alteran código de producción ni reemplazan lógica de negocio.
 */
export function escenarioV6() {
  const nodo = document.createElement("div");
  document.body.appendChild(nodo);
  const raiz = createRoot(nodo);
  const usuario = { id: "u1", run: "123456785", nombre: "Persona", apellidos: "Ejemplo",
    correo: "persona@gmail.com", direccion: "Calle 123", region: "Metropolitana de Santiago",
    comuna: "Melipilla", rol: "cliente" };
  const valores = { sesion: null, usuarios: [], cargando: false, errorPersistencia: "",
    ingresar: async () => ({ ok: true, usuario }), crear: async () => ({ ok: true, usuario }),
    actualizar: async () => ({ ok: true, usuario }), actualizarMiPerfil: async () => ({ ok: true, usuario }),
    eliminar: async () => true, salir: async () => true };
  async function montar(elemento, { ruta = "/", patron = null, contexto = {}, adicionales = [] } = {}) {
    await act(async () => {
      raiz.render(<MemoryRouter initialEntries={[ruta]}>
        <ContextoUsuarios.Provider value={{ ...valores, ...contexto }}>
          {(adicionales.length || patron) ? <Routes>
            <Route path={patron || ruta.split("?")[0]} element={elemento} />
            {adicionales.map(({ path, element }) => <Route key={path} path={path} element={element} />)}
          </Routes> : elemento}
        </ContextoUsuarios.Provider>
      </MemoryRouter>);
    });
    return nodo;
  }
  async function hacerClick(elemento) {
    if (!elemento) throw new Error("No existe el control de prueba");
    await act(async () => elemento.click());
  }
  async function escribir(elemento, valor) {
    if (!elemento) throw new Error("No existe el campo de prueba");
    await act(async () => {
      const proto = elemento.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype :
        elemento.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      descriptor?.set?.call(elemento, valor);
      elemento.dispatchEvent(new Event(elemento.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      if (elemento.tagName !== "SELECT") elemento.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  async function enviar(formulario) {
    if (!formulario) throw new Error("No existe el formulario de prueba");
    await act(async () => formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  }
  async function destruir() { await act(async () => raiz.unmount()); nodo.remove(); }
  return { nodo, usuario, valores, montar, hacerClick, escribir, enviar, destruir };
}
