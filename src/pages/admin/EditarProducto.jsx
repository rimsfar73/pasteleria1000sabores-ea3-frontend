import { api } from "../../services/api";
import { useParams, Link } from "react-router-dom";
import FormularioProducto from "../../components/FormularioProducto";
import "./EditarProducto.css";

export default function EditarProducto({ productos, actualizarProductos }) {
  const { codigo } = useParams();
  const original = productos.find((p) => p.codigo === codigo);
  if (!original) return <main className="editar-producto"><h1>Producto no encontrado</h1><Link to="/admin/productos">Volver al listado</Link></main>;
  async function editar(producto) {
    await api.put(`/productos/${codigo}`, producto);
    await actualizarProductos();
  }
  return <FormularioProducto key={codigo} titulo={`Editar: ${original.nombre}`}
    inicial={original} productos={productos} alGuardar={editar} esEdicion />;
}
