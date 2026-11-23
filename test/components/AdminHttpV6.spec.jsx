import CategoriasAdmin from "../../src/pages/admin/CategoriasAdmin";
import ConsultasAdmin from "../../src/pages/admin/ConsultasAdmin";
import NuevoProducto from "../../src/pages/admin/NuevoProducto";
import EditarProducto from "../../src/pages/admin/EditarProducto";
import Contacto from "../../src/pages/Contacto";
import { api } from "../../src/services/api";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · operaciones HTTP de administración y contacto",()=>{
 let e, previo, peticiones, responder;
 const producto={codigo:'TC001',nombre:'Torta',descripcion:'Chocolate',categoria:'Tortas Cuadradas',precio:45000,stock:10,
   imagen:'/img/tc001.jpg',disponible:true,personalizable:false,sinAzucar:false,sinGluten:false,vegano:false};
 const respuesta=(config,data,status=200)=>({config,data,status,headers:{}});
 const fallo=(config,mensaje,status=400)=>Promise.reject(Object.assign(new Error(mensaje),{config,response:{status,data:{mensaje}}}));
 beforeEach(()=>{e=escenarioV6();previo=api.defaults.adapter;peticiones=[];responder=c=>respuesta(c,[]);
   api.defaults.adapter=async c=>{peticiones.push(c);if(c.url==='/auth/csrf')return respuesta(c,{token:'csrf'});return responder(c)};
 });
 afterEach(async()=>{api.defaults.adapter=previo;await e.destruir();});
 it("categorías carga lista desde backend",async()=>{
   responder=c=>respuesta(c,['Tortas Cuadradas','Productos Veganos']);
   await e.montar(<CategoriasAdmin/>);
   expect(e.nodo.textContent).toContain('Productos Veganos');
 });
 it("categorías crea una categoría y vuelve a consultar API",async()=>{
   responder=c=>respuesta(c,c.url==='/categorias'&&c.method==='get'?['Tortas Cuadradas']:{});
   await e.montar(<CategoriasAdmin/>);
   await e.escribir(e.nodo.querySelector('input'),'Tortas Circulares');
   await e.enviar(e.nodo.querySelector('form'));
   expect(peticiones.some(c=>c.url==='/categorias'&&c.method==='post')).toBeTrue();
   expect(peticiones.filter(c=>c.url==='/categorias'&&c.method==='get').length).toBeGreaterThan(1);
 });
 it("categorías respeta cancelación de eliminación",async()=>{
   responder=c=>respuesta(c,['Tortas Cuadradas']);spyOn(window,'confirm').and.returnValue(false);
   await e.montar(<CategoriasAdmin/>);
   await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b=>b.textContent==='Eliminar'));
   expect(peticiones.some(c=>c.method==='delete')).toBeFalse();
 });
 it("categorías muestra rechazo de eliminación por productos asociados",async()=>{
   responder=c=>c.method==='delete'?fallo(c,'Categoría en uso',409):respuesta(c,['Tortas Cuadradas']);
   spyOn(window,'confirm').and.returnValue(true);
   await e.montar(<CategoriasAdmin/>);
   await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b=>b.textContent==='Eliminar'));
   expect(e.nodo.querySelector('[role="alert"]')?.textContent).toContain('Categoría en uso');
 });
 it("categorías muestra error al cargar",async()=>{
   responder=c=>fallo(c,'Error BD',500);
   await e.montar(<CategoriasAdmin/>);
   expect(e.nodo.textContent).toContain('Error BD');
 });
 it("consultas vacío indica ausencia de mensajes",async()=>{
   responder=c=>respuesta(c,[]);
   await e.montar(<ConsultasAdmin/>);
   expect(e.nodo.textContent).toContain('No hay consultas');
 });
 it("consultas presenta datos obtenidos desde la API",async()=>{
   responder=c=>respuesta(c,[{id:1,nombre:'Comprador',correo:'comprador@gmail.com',comentario:'Pregunta por torta',fecha:'2026-11-20T12:00:00'}]);
   await e.montar(<ConsultasAdmin/>);
   expect(e.nodo.textContent).toContain('Pregunta por torta');
   expect(e.nodo.textContent).toContain('comprador@gmail.com');
 });
 it("consultas muestra error de API",async()=>{
   responder=c=>fallo(c,'Sin acceso a consultas',403);
   await e.montar(<ConsultasAdmin/>);
   expect(e.nodo.querySelector('[role="alert"]')?.textContent).toContain('Sin acceso');
 });
 it("contacto envía consulta válida por API",async()=>{
   responder=c=>respuesta(c,{});
   await e.montar(<Contacto/>);
   await e.escribir(e.nodo.querySelector('input[name="nombre"]'),'Comprador');
   await e.escribir(e.nodo.querySelector('input[name="correo"]'),'comprador@gmail.com');
   await e.escribir(e.nodo.querySelector('textarea[name="comentario"]'),'Deseo saber si tienen stock');
   await e.enviar(e.nodo.querySelector('form'));
   expect(peticiones.some(c=>c.url==='/consultas'&&c.method==='post')).toBeTrue();
   expect(e.nodo.textContent).toContain('Consulta recibida correctamente');
 });
 it("contacto informa falla del servidor sin perder formulario",async()=>{
   responder=c=>fallo(c,'Temporalmente no disponible',503);
   await e.montar(<Contacto/>);
   await e.escribir(e.nodo.querySelector('input[name="nombre"]'),'Comprador');
   await e.escribir(e.nodo.querySelector('input[name="correo"]'),'comprador@gmail.com');
   await e.escribir(e.nodo.querySelector('textarea[name="comentario"]'),'Consulta importante');
   await e.enviar(e.nodo.querySelector('form'));
   expect(e.nodo.textContent).toContain('Temporalmente no disponible');
   expect(e.nodo.querySelector('textarea[name="comentario"]').value).toBe('Consulta importante');
 });
 it("alta de producto envía POST con atributos alimentarios",async()=>{
   responder=c=>respuesta(c,c.url==='/categorias'?['Tortas Cuadradas']:{});
   const actualizar=jasmine.createSpy('actualizar').and.resolveTo();
   await e.montar(<NuevoProducto productos={[]} actualizarProductos={actualizar}/>);
   for(const [campo,valor] of Object.entries({codigo:'TC200',nombre:'Torta nueva',descripcion:'Chocolate',precio:'10000',stock:'10',categoria:'Tortas Cuadradas'})){
     await e.escribir(e.nodo.querySelector(`[name="${campo}"]`),valor);
   }
   await e.enviar(e.nodo.querySelector('form'));
   const alta=peticiones.find(c=>c.url==='/productos'&&c.method==='post');
   expect(alta).toBeDefined();
   expect(JSON.parse(alta.data).stock).toBe(10);
   expect(actualizar).toHaveBeenCalled();
 });
 it("edición producto comunica cambios con PUT",async()=>{
   responder=c=>respuesta(c,c.url==='/categorias'?['Tortas Cuadradas']:{});
   const actualizar=jasmine.createSpy('actualizar').and.resolveTo();
   await e.montar(<EditarProducto productos={[producto]} actualizarProductos={actualizar}/>,
     {ruta:'/admin/producto/TC001/editar',patron:'/admin/producto/:codigo/editar'});
   await e.enviar(e.nodo.querySelector('form'));
   expect(peticiones.some(c=>c.url==='/productos/TC001'&&c.method==='put')).toBeTrue();
   expect(actualizar).toHaveBeenCalled();
 });
});
