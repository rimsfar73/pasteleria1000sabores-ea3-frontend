import { api } from "../../services/api";
import FormularioProducto from "../../components/FormularioProducto";
import "./NuevoProducto.css";

export default function NuevoProducto({ productos, actualizarProductos }) {
  async function crear(producto) {
    await api.post("/productos", producto);
    await actualizarProductos();
  }
  return <FormularioProducto titulo="Nuevo producto" productos={productos} alGuardar={crear} />;
}
