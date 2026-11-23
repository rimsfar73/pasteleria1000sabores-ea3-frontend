import { useEffect, useState } from "react";
import { api, mensajeError } from "../../services/api";
export default function ConsultasAdmin() {
 const [consultas, setConsultas] = useState([]);const [error, setError] = useState("");
 useEffect(() => {api.get("/consultas").then(r => setConsultas(r.data)).catch(e => setError(mensajeError(e)));}, []);
 return <section className="ea3-pagina"><h1>Consultas recibidas</h1>{error && <p role="alert">{error}</p>}{consultas.map(c => <article key={c.id} className="ea3-resumen"><h2>{c.nombre}</h2><p>{c.correo}</p><p>{c.comentario}</p><small>{new Date(c.fecha).toLocaleString("es-CL")}</small></article>)}{!consultas.length && <p>No hay consultas.</p>}</section>;
}
