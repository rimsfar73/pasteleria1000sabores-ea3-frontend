import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mensajeError } from "../services/api";
import { formatoPrecio } from "../utils/formatoPrecio";
export default function Pedidos({ gestion = false }) {
 const {id} = useParams();const [datos, setDatos] = useState(null);const [error, setError] = useState("");
 useEffect(() => { let activo = true; api.get(id ? `/pedidos/${id}` : "/pedidos").then(r => { if(activo) setDatos(r.data); }).catch(e => {if(activo) setError(mensajeError(e));}); return () => { activo = false; }; }, [id]);
 if(error) return <p role="alert">{error}</p>;
 if(!datos) return <p role="status">Cargando pedidos…</p>;
 const base = gestion ? "/admin/pedidos" : "/pedidos";
 const listaPedidos = Array.isArray(datos) ? datos
   : Array.isArray(datos.content) ? datos.content
   : Array.isArray(datos.pedidos) ? datos.pedidos : null;
 if (!id && !listaPedidos) return <p role="alert">No se pudo interpretar el listado de pedidos.</p>;
 return <section className="ea3-pagina"><h1>{id ? "Detalle del pedido" : gestion ? "Pedidos" : "Mis pedidos"}</h1>
 {id ? <><p>Número: {datos.id}</p><p>{new Date(datos.fecha).toLocaleString("es-CL")} · {datos.estado}</p><p>{datos.direccion}, {datos.comuna}, {datos.region}</p>{Array.isArray(datos.items) && datos.items.length > 0 ? datos.items.map((p, i) => <p key={p.codigo ?? i}>{p.nombre} × {p.cantidad}: {formatoPrecio(p.subtotal)}</p>) : <p>Detalle de productos no disponible en la respuesta del servidor.</p>}<p>Descuento: {formatoPrecio(datos.descuento)}</p>
<p>Neto: {formatoPrecio(datos.totalNeto)}</p>
<p>IVA incluido: {formatoPrecio(datos.totalIva)}</p>
{datos.telefono && <p>Contacto: {datos.telefono}</p>}
{datos.numero && <p>Número: {datos.numero}</p>}
{datos.observaciones && <p>Observaciones: {datos.observaciones}</p>}
<strong>Total: {formatoPrecio(datos.total)}</strong><p><Link to={base}>Volver a pedidos</Link></p></> : <>{!listaPedidos.length && <p>No hay pedidos.</p>}<div className="table-responsive"><table className="table"><thead><tr><th>Fecha</th><th>Estado</th><th>Total</th><th>Detalle</th></tr></thead><tbody>{listaPedidos.map(p => <tr key={p.id}><td>{new Date(p.fecha).toLocaleString("es-CL")}</td><td>{p.estado}</td><td>{formatoPrecio(p.total)}</td><td><Link to={`${base}/${p.id}`}>Ver pedido</Link></td></tr>)}</tbody></table></div></>}
 </section>;
}
