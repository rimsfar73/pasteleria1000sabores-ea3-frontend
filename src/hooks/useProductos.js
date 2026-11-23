import { useCallback, useEffect, useState } from "react";
import { api, mensajeError } from "../services/api";
export default function useProductos() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const actualizarProductos = useCallback(async () => {
    try { const {data} = await api.get("/productos"); setProductos(data); setError(""); }
    catch (e) { setError(mensajeError(e)); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => {
    let activo = true;
    api.get("/productos").then(({data}) => { if (activo) { setProductos(data); setError(""); } })
      .catch(e => { if (activo) setError(mensajeError(e)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);
  return { productos, actualizarProductos, error, cargando };
}
