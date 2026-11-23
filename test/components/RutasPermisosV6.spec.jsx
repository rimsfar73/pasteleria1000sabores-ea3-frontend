import Router from "../../src/router";
import { escenarioV6 } from "../helpers/montajeV6";
import { api } from "../../src/services/api";

describe("EA3 V6 · permisos reales de rutas y regresión de navegación", () => {
  let e, anterior;
  const producto={codigo:'TC001',nombre:'Torta chocolate',precio:45000,stock:10,disponible:true,categoria:'Tortas Cuadradas'};
  beforeEach(()=>{e=escenarioV6();anterior=api.defaults.adapter;
    api.defaults.adapter=async config=>({status:200,config,headers:{},data:config.url==='/auth/csrf'?{token:'csrf'}:[]});});
  afterEach(async()=>{api.defaults.adapter=anterior;await e.destruir();});
  async function visita(ruta,rol=null){
    const sesion=rol?{...e.usuario,rol}:null;
    // Para mostrar el formulario del checkout se necesita un carrito con ítems.
    // Un carrito vacío debe mostrar "Tu carrito está vacío" por diseño.
    const carrito = ruta === '/checkout' && rol === 'cliente'
      ? [{...producto, cantidad:1, imagen:'/img/tc001.jpg'}] : [];
    await e.montar(<Router productos={[producto]} carrito={carrito} sesion={sesion} agregarAlCarrito={()=>{}}
      actualizarProductos={async()=>{}} vaciarCarrito={()=>{}} abrirCarrito={()=>{}} cantidadTotal={carrito.length}
      subtotal={carrito.length?45000:0} descuento={0} total={carrito.length?45000:0} codigoCupon="" onCerrarSesion={async()=>true}/> ,
    { ruta, contexto:{ sesion, usuarios:sesion?[sesion]:[] } });
  }
  it("inicio y catálogo son públicos", async()=>{
    await visita('/');
    expect(e.nodo.textContent).toContain('Momentos inolvidables');
  });
  it("catálogo es público",async()=>{
    await visita('/productos');
    expect(e.nodo.textContent).toContain('Catálogo de productos');
  });
  it("página nosotros es pública",async()=>{
    await visita('/nosotros');
    expect(e.nodo.textContent).toContain('Una tradición');
  });
  it("blogs son públicos",async()=>{
    await visita('/blogs');
    expect(e.nodo.textContent).toContain('Historias para disfrutar');
  });
  it("registro es público",async()=>{
    await visita('/registro');
    expect(e.nodo.textContent).toContain('Registro de clientes');
  });
  it("checkout anónimo solicita autenticación",async()=>{
    await visita('/checkout');
    expect(e.nodo.textContent).toContain('Iniciar sesión');
  });
  it("pedidos anónimos requieren autenticación",async()=>{
    await visita('/pedidos');
    expect(e.nodo.textContent).toContain('Iniciar sesión');
  });
  it("perfil anónimo requiere autenticación",async()=>{
    await visita('/perfil');
    expect(e.nodo.textContent).toContain('Iniciar sesión');
  });
  it("perfil de cliente muestra sus datos",async()=>{
    await visita('/perfil','cliente');
    expect(e.nodo.textContent).toContain('Mi perfil');
  });
  it("checkout de cliente presenta datos de entrega",async()=>{
    await visita('/checkout','cliente');
    expect(e.nodo.textContent).toContain('Datos de entrega');
    expect(e.nodo.textContent).toContain('Finalizar compra');
  });
  it("admin tiene acceso al inicio de gestión",async()=>{
    await visita('/admin','admin');
    expect(e.nodo.textContent).toContain('Bienvenido al área de gestión');
  });
  it("vendedor no accede al inicio exclusivo de administración",async()=>{
    await visita('/admin','vendedor');
    expect(e.nodo.textContent).not.toContain('Bienvenido al área de gestión');
  });
  it("vendedor consulta productos sin editarlos",async()=>{
    await visita('/admin/productos','vendedor');
    expect(e.nodo.textContent).toContain('Consultar productos');
    expect(e.nodo.querySelector('a[href="/admin/producto/nuevo"]')).toBeNull();
  });
  it("administrador accede a editar catálogo",async()=>{
    await visita('/admin/productos','admin');
    expect(e.nodo.textContent).toContain('Administrar productos');
    expect(e.nodo.querySelector('a[href="/admin/producto/nuevo"]')).not.toBeNull();
  });
  it("vendedor no puede abrir la ruta de alta de productos",async()=>{
    await visita('/admin/producto/nuevo','vendedor');
    expect(e.nodo.textContent).not.toContain('Crear producto');
  });
  it("vendedor no puede abrir ruta para editar productos",async()=>{
    await visita('/admin/producto/TC001/editar','vendedor');
    expect(e.nodo.textContent).not.toContain('Guardar cambios');
  });
  it("vendedor puede abrir detalle del producto",async()=>{
    await visita('/admin/producto/TC001','vendedor');
    expect(e.nodo.textContent).toContain('Torta chocolate');
  });
  it("vendedor no puede abrir gestión de usuarios",async()=>{
    await visita('/admin/usuarios','vendedor');
    expect(e.nodo.textContent).not.toContain('Administración de usuarios');
  });
  it("cliente no puede abrir consultas administrativas",async()=>{
    await visita('/admin/consultas','cliente');
    expect(e.nodo.textContent).not.toContain('Consultas recibidas');
  });
  it("administrador consulta usuarios",async()=>{
    await visita('/admin/usuarios','admin');
    expect(e.nodo.textContent).toContain('Administración de usuarios');
  });
  it("ruta inexistente muestra 404",async()=>{
    await visita('/ruta-inventada');
    expect(e.nodo.textContent).toContain('Página no encontrada');
  });
});
