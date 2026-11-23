import { act, useEffect } from "react";
import useCarrito from "../../src/hooks/useCarrito";
import useProductos from "../../src/hooks/useProductos";
import { api } from "../../src/services/api";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · hooks de datos reales y carrito (regresión de EA2)", () => {
  let e, estado, adapterAnterior, responder, llamadas;
  const producto = {codigo:'TC001',nombre:'Torta chocolate',precio:45000,stock:3,disponible:true,imagen:'/img/tc001.jpg',categoria:'Tortas Cuadradas'};
  function CarritoObservador({productos=[producto]}) {
    const actual=useCarrito(productos);
    useEffect(()=>{estado=actual;});
    return <span data-carrito>{actual.cantidadTotal} unidades · {actual.subtotal} CLP</span>;
  }
  function ProductosObservador() {
    const actual=useProductos();
    useEffect(()=>{estado=actual;});
    return <span>{actual.cargando?'Cargando':`${actual.productos.length} productos`}{actual.error}</span>;
  }
  beforeEach(()=>{
    e=escenarioV6();estado=null;llamadas=[];adapterAnterior=api.defaults.adapter;responder=()=>[];
    api.defaults.adapter=async config=>{
      llamadas.push(config);
      if(config.url==='/auth/csrf')return {config,status:200,headers:{},data:{token:'csrf'}};
      return {config,status:200,headers:{},data:await responder(config)};
    };
    localStorage.removeItem('mil-sabores-carrito');localStorage.removeItem('mil-sabores-cupon');
  });
  afterEach(async()=>{api.defaults.adapter=adapterAnterior;await e.destruir();});
  it("inicia carrito vacío sin descuentos",async()=>{
    await e.montar(<CarritoObservador/>);
    expect(estado.carrito.length).toBe(0);
    expect(estado.total).toBe(0);
    expect(estado.cantidadTotal).toBe(0);
  });
  it("agrega productos existentes y calcula subtotal",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    expect(estado.carrito.length).toBe(1);
    expect(estado.subtotal).toBe(45000);
    expect(estado.cantidadTotal).toBe(1);
  });
  it("no incorpora un producto inexistente en el catálogo",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito({...producto,codigo:'FALSO'}));
    expect(estado.carrito.length).toBe(0);
  });
  it("respeta cantidad disponible y rechaza sobreventa",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    await act(async()=>estado.actualizarCantidad(producto.codigo,2));
    expect(estado.cantidadTotal).toBe(2);
    await act(async()=>estado.actualizarCantidad(producto.codigo,10));
    expect(estado.cantidadTotal).toBe(2);
  });
  it("permite quitar unidad y deja el carrito vacío",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    await act(async()=>estado.quitarDelCarrito(producto.codigo));
    expect(estado.carrito.length).toBe(0);
  });
  it("vaciar carrito elimina productos y cupón de demostración",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    await act(async()=>estado.vaciarCarrito());
    expect(estado.cantidadTotal).toBe(0);
    expect(estado.codigoCupon).toBe('');
  });
  it("rechaza cupón inexistente sin alterar total",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    let valido;await act(async()=>{valido=estado.aplicarCupon('NO_EXISTE')});
    expect(valido).toBeFalse();
    expect(estado.total).toBe(45000);
  });
  it("aplica cupón comercial válido y permite quitarlo",async()=>{
    await e.montar(<CarritoObservador/>);
    await act(async()=>estado.agregarAlCarrito(producto));
    let valido;await act(async()=>{valido=estado.aplicarCupon('PASTEL10')});
    expect(valido).toBeTrue();
    expect(estado.descuento).toBe(4500);
    expect(estado.total).toBe(40500);
    await act(async()=>estado.quitarCupon());
    expect(estado.total).toBe(45000);
  });
  it("useProductos carga lista real desde API",async()=>{
    responder=()=>[producto];
    await e.montar(<ProductosObservador/>);
    expect(estado.productos.length).toBe(1);
    expect(estado.cargando).toBeFalse();
    expect(llamadas.some(c=>c.url==='/productos')).toBeTrue();
  });
  it("actualizarProductos relee catálogo y reemplaza el stock",async()=>{
    responder=()=>[producto];
    await e.montar(<ProductosObservador/>);
    responder=()=>[{...producto,stock:7}];
    await act(async()=>estado.actualizarProductos());
    expect(estado.productos[0].stock).toBe(7);
  });
  it("maneja fallo de red y ofrece mensaje recuperable",async()=>{
    responder=()=>Promise.reject(new Error('Servidor desconectado'));
    await e.montar(<ProductosObservador/>);
    expect(estado.cargando).toBeFalse();
    expect(estado.error).toContain('No se pudo conectar');
  });
});
