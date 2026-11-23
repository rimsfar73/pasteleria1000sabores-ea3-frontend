import { api, mensajeError } from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIAS_PRODUCTO, validarDatosProducto } from "../utils/validarDatosProducto";
import "./FormularioProducto.css";

const VACIO = {
  codigo: "", nombre: "", descripcion: "", categoria: "", precio: "", stock: "", imagen: "",
  disponible: true, personalizable: false, sinAzucar: false, sinGluten: false, vegano: false,
};

export default function FormularioProducto({ titulo, inicial = VACIO, productos, alGuardar, esEdicion = false }) {
  const [formulario, setFormulario] = useState(() => ({ ...VACIO, ...inicial }));
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState(CATEGORIAS_PRODUCTO);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { api.get("/categorias").then(r => setCategorias(r.data)).catch(() => {}); }, []);
  const navigate = useNavigate();

  function cambiar(evento) {
    const { name, type, value, checked } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: type === "checkbox" ? checked : value }));
    setErrores((anterior) => ({ ...anterior, [name]: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const resultado = validarDatosProducto(formulario, productos, esEdicion ? inicial.codigo : null);
    if (!resultado.valido) {
      setErrores(resultado.errores);
      return;
    }
    if (ocupado) return;
    setOcupado(true);
    try { await alGuardar(resultado.producto); navigate("/admin/productos"); }
    catch (e) { setErrores({ general: mensajeError(e), ...e.response?.data?.errores }); }
    finally { setOcupado(false); }
  }

  const campo = (nombre, etiqueta, tipo = "text") => (
    <div className="campo-producto" key={nombre}>
      <label htmlFor={`producto-${nombre}`}>{etiqueta}</label>
      <input id={`producto-${nombre}`} name={nombre} type={tipo}
        value={formulario[nombre]} onChange={cambiar}
        readOnly={esEdicion && nombre === "codigo"}
        min={nombre === "stock" ? 0 : tipo === "number" ? 1 : undefined}
        step={tipo === "number" ? 1 : undefined}
        aria-invalid={Boolean(errores[nombre])}
        aria-describedby={errores[nombre] ? `error-${nombre}` : undefined} />
      {errores[nombre] && <small className="error-producto" id={`error-${nombre}`}>{errores[nombre]}</small>}
    </div>
  );

  return (
    <main className="formulario-producto-pagina">
      <h1>{titulo}</h1>
      <form onSubmit={enviar} noValidate>
        {errores.general && <p role="alert">{errores.general}</p>}
        {campo("codigo", "Código")}
        {campo("nombre", "Nombre")}
        <div className="campo-producto">
          <label htmlFor="producto-descripcion">Descripción</label>
          <textarea id="producto-descripcion" name="descripcion" rows="3"
            value={formulario.descripcion} onChange={cambiar} aria-invalid={Boolean(errores.descripcion)} />
          {errores.descripcion && <small className="error-producto">{errores.descripcion}</small>}
        </div>
        <div className="campo-producto">
          <label htmlFor="producto-categoria">Categoría</label>
          <select id="producto-categoria" name="categoria" value={formulario.categoria} onChange={cambiar}>
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {errores.categoria && <small className="error-producto">{errores.categoria}</small>}
        </div>
        {campo("precio", "Precio (CLP)", "number")}
        {campo("stock", "Stock (unidades)", "number")}
        {campo("imagen", "Imagen (ej.: /img/tc001.jpg)")}
        <fieldset className="opciones-producto">
          <legend>Opciones del producto</legend>

          <label className="opcion-producto">
            <input
              name="disponible"
              type="checkbox"
              checked={formulario.disponible}
              onChange={cambiar}
            />
            <span>
              <strong>Disponible</strong>
              <small>Producto habilitado en el catálogo</small>
            </span>
          </label>

          <label className="opcion-producto">
            <input
              name="personalizable"
              type="checkbox"
              checked={formulario.personalizable}
              onChange={cambiar}
            />
            <span>
              <strong>Personalizable</strong>
              <small>Producto que admite personalización</small>
            </span>
          </label>
          {[
            ["sinAzucar", "Sin azúcar"],
            ["sinGluten", "Sin gluten"],
            ["vegano", "Vegano"],
          ].map(([nombre, etiqueta]) => (
            <label className="opcion-producto" key={nombre}>
              <input name={nombre} type="checkbox" checked={Boolean(formulario[nombre])} onChange={cambiar} />
              <span><strong>{etiqueta}</strong><small>Atributo alimentario del producto (Taller BD)</small></span>
            </label>
          ))}
        </fieldset>

        <div className="acciones-formulario">
          <button
            type="submit"
            className="producto-boton-guardar" disabled={ocupado}
          >
            {esEdicion ? "Guardar cambios" : "Crear producto"}
          </button>

          <button
            type="button"
            className="producto-boton-cancelar"
            onClick={() => navigate("/admin/productos")}
          >
            ← Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
