import { NavLink } from "react-router-dom";
import { useUsuarios } from "../hooks/useUsuarios.js";
import "./MenuAdmin.css";
export default function MenuAdmin() {
 const { sesion } = useUsuarios();
 return <header className="ea3-menu"><nav aria-label="Administración">
   <NavLink to="/admin/productos">Productos</NavLink>
   <NavLink to="/admin/pedidos">Pedidos</NavLink>
   {sesion?.rol === "admin" && <><NavLink to="/admin/usuarios">Usuarios</NavLink><NavLink to="/admin/consultas">Consultas</NavLink><NavLink to="/admin/categorias">Categorías</NavLink></>}
 </nav></header>;
}
