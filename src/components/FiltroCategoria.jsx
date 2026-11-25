import "./FiltroCategoria.css";
import { CATEGORIAS_PRODUCTO } from "../utils/validarDatosProducto";

export default function FiltroCategoria({ valor, onFiltrar, categorias = CATEGORIAS_PRODUCTO }) {
  return (
    <div className="filtro-item">
      <label htmlFor="categoria-select">Categoría</label>
      <select id="categoria-select" value={valor} onChange={(e) => onFiltrar(e.target.value)}>
        <option value="">Todas</option>
        {categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
      </select>
    </div>
  );
}
