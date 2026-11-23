import Inicio from "../../src/pages/Inicio";
import Nosotros from "../../src/pages/Nosotros";
import Blogs from "../../src/pages/Blogs";
import DetalleBlog from "../../src/pages/DetalleBlog";
import NoEncontrado from "../../src/pages/NoEncontrado";
import Productos from "../../src/pages/Productos";
import DetalleProducto from "../../src/pages/DetalleProducto";
import Contacto from "../../src/pages/Contacto";
import Pedidos from "../../src/pages/Pedidos";
import blogs from "../../src/data/blogs";
import { api } from "../../src/services/api";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · catálogo, contenido y pedidos HTTP", () => {
  let e, adapterOriginal, llamadas, responder;
  const producto={ codigo:'TC001',nombre:'Torta chocolate',descripcion:'Chocolate intenso',precio:45000,stock:10,
    disponible:true, personalizable:true, categoria:'Tortas Cuadradas', imagen:'/img/tc001.jpg' };
  const pedido={id:'PED1', fecha:'2026-11-19T10:30:00',estado:'CONFIRMADO',direccion:'Calle 123', comuna:'Melipilla',region:'Metropolitana de Santiago',
    items:[{codigo:producto.codigo,nombre:producto.nombre,cantidad:1,subtotal:45000}],descuento:4500,totalNeto:34034,totalIva:6466,total:40500,telefono:'987654321',numero:'20',observaciones:'Sin velas'};
  beforeEach(()=>{e=escenarioV6();adapterOriginal=api.defaults.adapter;llamadas=[];responder=()=>[];
    api.defaults.adapter=async cfg=>{llamadas.push(cfg);if(cfg.url==='/auth/csrf')return {data:{token:'csrf'},config:cfg,status:200,headers:{}};return {data:await responder(cfg),config:cfg,status:200,headers:{}};}; });
  afterEach(async()=>{api.defaults.adapter=adapterOriginal;await e.destruir();});
  it("inicio conserva el diseño y enlaces públicos",async()=>{
    await e.montar(<Inicio productos={[]} agregarAlCarrito={()=>{}}/>);
    expect(e.nodo.textContent).toContain('Momentos inolvidables');
    expect(e.nodo.querySelector('a[href="/productos"]')).not.toBeNull();
  });
  it("inicio muestra torta destacada y estado de stock",async()=>{
    await e.montar(<Inicio productos={[{...producto,codigo:'ES001'}]} agregarAlCarrito={()=>{}}/>);
    expect(e.nodo.textContent).toContain('Torta chocolate');
    expect(e.nodo.textContent).toContain('Quedan 10 unidades');
  });
  it("página nosotros conserva historia y valores de marca",async()=>{
    await e.montar(<Nosotros/>);
    expect(e.nodo.textContent).toContain('Una tradición');
    expect(e.nodo.querySelector('a[href="/productos"]')).not.toBeNull();
  });
  it("blogs lista artículos y enlaces de detalle",async()=>{
    await e.montar(<Blogs/>);
    expect(e.nodo.textContent).toContain('Historias para disfrutar');
    expect(e.nodo.querySelector(`a[href="/blogs/${blogs[0].id}"]`)).not.toBeNull();
  });
  it("detalle de blog existente presenta secciones e imagen",async()=>{
    await e.montar(<DetalleBlog/>,{ruta:`/blogs/${blogs[0].id}`,patron:'/blogs/:id'});
    expect(e.nodo.textContent).toContain(blogs[0].titulo);
    expect(e.nodo.querySelector('img')).not.toBeNull();
  });
  it("detalle de blog inválido ofrece regreso",async()=>{
    await e.montar(<DetalleBlog/>,{ruta:'/blogs/9999',patron:'/blogs/:id'});
    expect(e.nodo.textContent).toContain('Artículo no encontrado');
    expect(e.nodo.querySelector('a[href="/blogs"]')).not.toBeNull();
  });
  it("ruta no encontrada presenta error 404 amigable",async()=>{
    await e.montar(<NoEncontrado/>);
    expect(e.nodo.textContent).toContain('Página no encontrada');
    expect(e.nodo.querySelector('a[href="/"]')).not.toBeNull();
  });
  it("catálogo presenta productos desde props y filtros",async()=>{
    await e.montar(<Productos productos={[producto]} agregarAlCarrito={()=>{}}/>);
    expect(e.nodo.textContent).toContain('Torta chocolate');
    expect(e.nodo.querySelector('#buscador-input')).not.toBeNull();
    expect(e.nodo.querySelector('#categoria-select')).not.toBeNull();
  });
  it("buscador filtra productos sin cambiar los datos originales",async()=>{
    await e.montar(<Productos productos={[producto,{...producto,codigo:'PI001',nombre:'Cheesecake'}]} agregarAlCarrito={()=>{}}/>);
    await e.escribir(e.nodo.querySelector('#buscador-input'),'Cheesecake');
    expect(e.nodo.textContent).toContain('Cheesecake');
    expect(e.nodo.textContent).not.toContain('Torta chocolate');
  });
  it("categoría filtra el listado",async()=>{
    await e.montar(<Productos productos={[producto,{...producto,codigo:'PI001',nombre:'Cheesecake',categoria:'Postres Individuales'}]} agregarAlCarrito={()=>{}}/>);
    await e.escribir(e.nodo.querySelector('#categoria-select'),'Postres Individuales');
    expect(e.nodo.textContent).toContain('Cheesecake');
    expect(e.nodo.textContent).not.toContain('Torta chocolate');
  });
  it("detalle muestra precio y stock desde API",async()=>{
    await e.montar(<DetalleProducto productos={[producto]}/>,{ruta:'/producto/TC001',patron:'/producto/:codigo'});
    expect(e.nodo.textContent).toContain('$45.000');
    expect(e.nodo.textContent).toContain('10 unidades');
  });
  it("detalle con stock cero muestra sin stock",async()=>{
    await e.montar(<DetalleProducto productos={[{...producto,stock:0}]}/>,{ruta:'/producto/TC001',patron:'/producto/:codigo'});
    expect(e.nodo.textContent).toContain('Sin stock');
  });
  it("detalle inexistente vuelve al catálogo",async()=>{
    await e.montar(<DetalleProducto productos={[]}/>,{ruta:'/producto/INEXISTENTE',patron:'/producto/:codigo'});
    expect(e.nodo.textContent).toContain('Producto no encontrado');
  });
  it("contacto rechaza una consulta sin campos",async()=>{
    await e.montar(<Contacto/>);
    await e.enviar(e.nodo.querySelector('form'));
    expect(e.nodo.textContent).toContain('Revisa los datos del formulario');
    expect(llamadas.filter(c=>c.url==='/consultas').length).toBe(0);
  });
  it("contacto usa nombre y correo de sesión y los deja de solo lectura",async()=>{
    await e.montar(<Contacto/>,{contexto:{sesion:e.usuario}});
    expect(e.nodo.querySelector('input[name="nombre"]').readOnly).toBeTrue();
    expect(e.nodo.querySelector('input[name="correo"]').value).toBe(e.usuario.correo);
  });
  it("pedidos muestra lista y enlace al detalle",async()=>{
    responder=()=>[pedido];
    await e.montar(<Pedidos/>,{ruta:'/pedidos'});
    expect(e.nodo.textContent).toContain('Mis pedidos');
    expect(e.nodo.querySelector('a[href="/pedidos/PED1"]')).not.toBeNull();
    expect(llamadas.some(c=>c.url==='/pedidos')).toBeTrue();
  });
  it("pedidos vacío informa ausencia de compras",async()=>{
    responder=()=>[];
    await e.montar(<Pedidos/>,{ruta:'/pedidos'});
    expect(e.nodo.textContent).toContain('No hay pedidos');
  });
  it("detalle de pedido muestra desglose neto e IVA incluido",async()=>{
    responder=()=>pedido;
    await e.montar(<Pedidos/>,{ruta:'/pedidos/PED1',patron:'/pedidos/:id'});
    expect(e.nodo.textContent).toContain('Neto');
    expect(e.nodo.textContent).toContain('IVA incluido');
    expect(e.nodo.textContent).toContain('Sin velas');
    expect(e.nodo.textContent).toContain('$40.500');
  });
  it("listado vendedor usa ruta administrativa",async()=>{
    responder=()=>[pedido];
    await e.montar(<Pedidos gestion/>,{ruta:'/admin/pedidos'});
    expect(e.nodo.querySelector('a[href="/admin/pedidos/PED1"]')).not.toBeNull();
  });
});
