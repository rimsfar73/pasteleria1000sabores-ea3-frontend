import { useEffect, useState } from "react";
import { api, mensajeError } from "../../services/api";
export default function CategoriasAdmin() {
 const [categorias, setCategorias] = useState([]);const [nombre, setNombre] = useState("");const [error, setError] = useState("");
 async function cargar(){const {data} = await api.get("/categorias");setCategorias(data);}
 useEffect(() => {api.get("/categorias").then(r => setCategorias(r.data)).catch(e => setError(mensajeError(e)));}, []);
 async function crear(e){e.preventDefault();try{await api.post("/categorias", {nombre});setNombre("");setError("");await cargar();}catch(e){setError(mensajeError(e));}}
 async function eliminar(c){if(!window.confirm("¿Eliminar categoría sin productos?"))return;try{await api.delete(`/categorias/${encodeURIComponent(c)}`);await cargar();setError("");}catch(e){setError(mensajeError(e));}}
 return <section className="ea3-pagina"><h1>Categorías</h1><form className="lucia-form" onSubmit={crear}><label>Nombre<input value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={100} required /></label><button>Crear categoría</button></form>{error && <p role="alert">{error}</p>}<ul>{categorias.map(c=><li key={c}>{c} <button onClick={()=>eliminar(c)}>Eliminar</button></li>)}</ul></section>;
}
