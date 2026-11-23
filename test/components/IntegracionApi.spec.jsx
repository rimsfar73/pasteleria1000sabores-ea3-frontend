import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { api, establecerToken, renovarSesion, cerrarSesionLocal } from "../../src/services/api";
import { ContextoUsuarios } from "../../src/context/contextoUsuarios";
import { UsuariosProvider } from "../../src/hooks/useUsuarios.jsx";
import { useUsuarios } from "../../src/hooks/useUsuarios.js";
import ProductosAdmin from "../../src/pages/admin/ProductosAdmin";
import Contacto from "../../src/pages/Contacto";
import Checkout from "../../src/pages/Checkout";
import Router from "../../src/router";

describe("Integración EA3 con API simulada", () => {
 let nodo, raiz, anterior, llamadas, responder;
 const cliente = {id:"cli",nombre:"Cliente",rol:"cliente",direccion:"Calle 123",region:"Metropolitana de Santiago",comuna:"Melipilla",correo:"cliente@gmail.com"};
 const producto = {codigo:"T1",nombre:"Torta",descripcion:"Chocolate",precio:10000,stock:3,disponible:true,categoria:"Tortas Cuadradas"};
 const pedido = {id:"p1",items:[{...producto,cantidad:1,subtotal:10000}],subtotal:10000,descuento:0,total:10000};
 function respuesta(config,data,status=200){return {data,status,statusText:"OK",headers:{},config};}
 function fallo(config,status){const mensaje=status===422?"Pago de demostración rechazado: sin pedido ni descuento de inventario.":"Acceso denegado";return Promise.reject(Object.assign(new Error("API"), {config,response:{status,data:{mensaje}}}));}
 beforeEach(() => {
  nodo=document.createElement("div");document.body.appendChild(nodo);raiz=createRoot(nodo);llamadas=[];anterior=api.defaults.adapter;establecerToken("reiniciar-prueba");establecerToken(null);
  responder = config => respuesta(config, {});
  api.defaults.adapter=async config => {llamadas.push(config);if(config.url==="/auth/csrf")return respuesta(config,{token:"csrf-prueba"});return responder(config);};
 });
 afterEach(async () => {await act(async()=>raiz.unmount());nodo.remove();api.defaults.adapter=anterior;establecerToken(null);});
 async function esperarCarga(estado) {
  for (let i=0;i<100 && (!estado() || estado().cargando);i++)
   await act(async()=>new Promise(resolve=>setTimeout(resolve,10)));
  expect(estado()?.cargando).toBeFalse();
 }
 async function montar(element,rol="admin",ruta="/"){await act(async()=>{raiz.render(<MemoryRouter initialEntries={[ruta]}><ContextoUsuarios.Provider value={{sesion:{...cliente,rol},usuarios:[cliente],salir:()=>{},errorPersistencia:""}}>{element}</ContextoUsuarios.Provider></MemoryRouter>);});}
 it("envía JWT y CSRF al modificar datos",async()=>{establecerToken("jwt-prueba");await api.post("/productos",producto);const c=llamadas.find(x=>x.url==="/productos");expect(c.headers.Authorization).toBe("Bearer jwt-prueba");expect(c.headers["X-XSRF-TOKEN"]).toBeTruthy();});
 it("comparte una renovación entre solicitudes simultáneas",async()=>{responder=c=>respuesta(c,{accessToken:"nuevo",usuario:cliente});await Promise.all([renovarSesion(),renovarSesion()]);expect(llamadas.filter(c=>c.url==="/auth/refresh").length).toBe(1);});
 it("renueva una vez al recibir 401 y reintenta la consulta",async()=>{let intentos=0;responder=c=>c.url==="/auth/refresh"?respuesta(c,{accessToken:"nuevo",usuario:cliente}):++intentos===1?fallo(c,401):respuesta(c,[]);await api.get("/pedidos");expect(intentos).toBe(2);expect(llamadas.filter(c=>c.url==="/auth/refresh").length).toBe(1);});
 it("no renueva ante un 403",async()=>{responder=c=>fallo(c,403);await expectAsync(api.get("/usuarios")).toBeRejected();expect(llamadas.some(c=>c.url==="/auth/refresh")).toBeFalse();});
 it("restaura sesión usando refresh, sin guardar JWT en localStorage",async()=>{let estado;responder=c=>c.url==="/auth/refresh"?respuesta(c,{accessToken:"secreto-prueba",usuario:cliente}):respuesta(c,[]);function Observador(){const valor=useUsuarios();useEffect(()=>{estado=valor;},[valor]);return <p>{valor.sesion?.nombre}</p>;}await act(async()=>raiz.render(<UsuariosProvider><Observador/></UsuariosProvider>));await esperarCarga(()=>estado);expect(estado.sesion.id).toBe("cli");expect(JSON.stringify(localStorage)).not.toContain("secreto-prueba");});
 it("muestra mensaje del servidor cuando falla login",async()=>{let estado;responder=c=>fallo(c,401);function Observador(){const valor=useUsuarios();useEffect(()=>{estado=valor;},[valor]);return null;}await act(async()=>raiz.render(<UsuariosProvider><Observador/></UsuariosProvider>));let result;await act(async()=>{result=await estado.ingresar("a@gmail.com","mal");});expect(result.ok).toBeFalse();expect(result.mensaje).toBe("Acceso denegado");});
 it("vendedor no ve editar, eliminar ni crear productos",async()=>{await montar(<ProductosAdmin productos={[producto]} actualizarProductos={()=>{}}/>,"vendedor");expect(nodo.textContent).toContain("Consultar productos");expect(nodo.querySelector('a[href="/admin/producto/nuevo"]')).toBeNull();expect(nodo.querySelector('button[aria-label="Eliminar Torta"]')).toBeNull();});
 it("administrador elimina mediante DELETE y recarga catálogo",async()=>{const recargar=jasmine.createSpy("recargar");spyOn(window,"confirm").and.returnValue(true);await montar(<ProductosAdmin productos={[producto]} actualizarProductos={recargar}/>);await act(async()=>nodo.querySelector('button[aria-label="Eliminar Torta"]').click());expect(llamadas.some(c=>c.method==="delete"&&c.url==="/productos/T1")).toBeTrue();expect(recargar).toHaveBeenCalled();});
 it("vendedor no puede entrar a crear productos por URL",async()=>{await montar(<Router productos={[producto]} sesion={{...cliente,rol:"vendedor"}} cantidadTotal={0}/>,"vendedor","/admin/producto/nuevo");expect(nodo.querySelector("h1")?.textContent).not.toBe("Nuevo producto");});
 it("checkout consulta al servidor sin enviar precios",async()=>{responder=c=>respuesta(c,pedido);await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} codigoCupon="" vaciarCarrito={()=>{}} actualizarProductos={()=>{}}/>,"cliente");await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));const c=llamadas.find(c=>c.url==="/pedidos/cotizar");expect(JSON.parse(c.data).items).toEqual([{codigo:"T1",cantidad:1}]);expect(nodo.textContent).toContain("Confirmar pedido");});
 it("confirmar envía clave idempotente y vacía carrito tras éxito",async()=>{responder=c=>respuesta(c,pedido);const vaciar=jasmine.createSpy("vaciar");await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} codigoCupon="" vaciarCarrito={vaciar} actualizarProductos={()=>{}}/>,"cliente");await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));await act(async()=>[...nodo.querySelectorAll("button")].find(b=>b.textContent==="Confirmar pedido").click());expect(llamadas.find(c=>c.url==="/pedidos").headers["Idempotency-Key"]).toBeTruthy();expect(vaciar).toHaveBeenCalled();expect(nodo.textContent).toContain("Pedido confirmado");});
 it("stock rechazado conserva el carrito",async()=>{responder=c=>c.url==="/pedidos/cotizar"?respuesta(c,pedido):fallo(c,409);const vaciar=jasmine.createSpy("vaciar");await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} codigoCupon="" vaciarCarrito={vaciar} actualizarProductos={()=>{}}/>,"cliente");await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));await act(async()=>[...nodo.querySelectorAll("button")].find(b=>b.textContent==="Confirmar pedido").click());expect(vaciar).not.toHaveBeenCalled();expect(nodo.querySelector('[role="alert"]')).not.toBeNull();});
 it("contacto mantiene contador conectado al comentario",async()=>{await montar(<Contacto/>);const input=nodo.querySelector("textarea");await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"hola");input.dispatchEvent(new Event("input",{bubbles:true}));});expect(nodo.querySelector("#contador-comentario").textContent).toContain("4 de 500");});
 it("refresh y logout no envían el JWT vencido", async () => {
  establecerToken("vencido"); responder=c=>respuesta(c,{accessToken:"nuevo",usuario:cliente});
  await renovarSesion(); await api.post("/auth/logout");
  for (const c of llamadas.filter(c=>c.url==="/auth/refresh"||c.url==="/auth/logout")) expect(c.headers.Authorization).toBeUndefined();
 });
 it("una renovación tardía no restaura la sesión cerrada", async () => {
  let terminar, iniciada;
  const inicio=new Promise(resolve=>{iniciada=resolve;});
  responder=c=>new Promise(resolve=>{terminar=()=>resolve(respuesta(c,{accessToken:"tardio",usuario:cliente}));iniciada();});
  const renovar=renovarSesion(); await inicio; cerrarSesionLocal(); terminar();
  await expectAsync(renovar).toBeRejected();
  responder=c=>respuesta(c,[]); await api.get("/productos");
  expect(llamadas.at(-1).headers.Authorization).toBeUndefined();
  await expectAsync(renovarSesion()).toBeRejected();
 });
 it("logout sin conexión limpia usuario y token", async () => {
  let estado;
  responder=c=>c.url==="/auth/refresh"?respuesta(c,{accessToken:"activo",usuario:cliente}):fallo(c,503);
  function Observador(){const valor=useUsuarios();useEffect(()=>{estado=valor;},[valor]);return null;}
  await act(async()=>raiz.render(<UsuariosProvider><Observador/></UsuariosProvider>));
  await esperarCarga(()=>estado);
  expect(estado.sesion).not.toBeNull();
  await act(async()=>estado.salir());
  expect(estado.sesion).toBeNull(); expect(estado.usuarios).toEqual([]);
  expect(estado.errorPersistencia).toContain("Sesión cerrada");
  await expectAsync(renovarSesion()).toBeRejected();
 });
 it("cambiar cantidades o cupón oculta confirmar hasta volver a cotizar", async () => {
  responder=c=>respuesta(c,pedido);
  const pantalla=(cantidad,cupon)=><Checkout sesion={cliente} carrito={[{...producto,cantidad}]} codigoCupon={cupon} vaciarCarrito={()=>{}} actualizarProductos={async()=>{}}/>;
  await montar(pantalla(1,""),"cliente");
  await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
  await montar(pantalla(2,""),"cliente");
  expect([...nodo.querySelectorAll("button")].some(b=>b.textContent==="Confirmar pedido")).toBeFalse();
  await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
  await montar(pantalla(2,"PASTEL10"),"cliente");
  expect([...nodo.querySelectorAll("button")].some(b=>b.textContent==="Confirmar pedido")).toBeFalse();
 });
 it("reintentar tras perder respuesta conserva clave y datos aceptados", async () => {
  let intentos=0;
  responder=c=>c.url==="/pedidos/cotizar"?respuesta(c,pedido):++intentos===1?fallo(c,503):respuesta(c,pedido);
  await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} codigoCupon="" vaciarCarrito={()=>{}} actualizarProductos={async()=>{}}/>,"cliente");
  await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
  for(let i=0;i<2;i++) await act(async()=>[...nodo.querySelectorAll("button")].find(b=>b.textContent==="Confirmar pedido").click());
  const compras=llamadas.filter(c=>c.url==="/pedidos");
  expect(compras.length).toBe(2); expect(compras[0].data).toBe(compras[1].data);
  expect(compras[0].headers["Idempotency-Key"]).toBe(compras[1].headers["Idempotency-Key"]);
  expect(JSON.parse(compras[0].data).totalEsperado).toBe(10000);
 });



 it("checkout permite simular rechazo sin modificar el carrito",async()=>{
  responder=c=>c.url==="/pedidos/cotizar"?respuesta(c,pedido):fallo(c,422);
  const vaciar=jasmine.createSpy("vaciar");
  await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} vaciarCarrito={vaciar} actualizarProductos={async()=>{}}/>,"cliente");
  const selector=nodo.querySelector('select[name="resultadoPago"]');
  expect(selector).not.toBeNull();
  await act(async()=>{selector.value="RECHAZADO";selector.dispatchEvent(new Event("change",{bubbles:true}));});
  await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
  const cotizar=llamadas.find(c=>c.url==="/pedidos/cotizar");
  expect(JSON.parse(cotizar.data).resultadoPago).toBe("RECHAZADO");
  await act(async()=>[...nodo.querySelectorAll("button")].find(b=>b.textContent==="Confirmar pedido").click());
  const compra=llamadas.find(c=>c.url==="/pedidos");
  expect(JSON.parse(compra.data).resultadoPago).toBe("RECHAZADO");
  expect(vaciar).not.toHaveBeenCalled();
  expect(nodo.textContent).toContain("Pago de demostración rechazado");
 });
 it("el pago simulado aprobado sigue enviando aprobación explícita",async()=>{
  responder=c=>respuesta(c,pedido);
  await montar(<Checkout sesion={cliente} carrito={[{...producto,cantidad:1}]} actualizarProductos={async()=>{}}/>,"cliente");
  await act(async()=>nodo.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
  const cotizar=llamadas.find(c=>c.url==="/pedidos/cotizar");
  expect(JSON.parse(cotizar.data).resultadoPago).toBe("APROBADO");
 });

});
