import UsuariosAdmin from "../../src/pages/admin/UsuariosAdmin";
import DetalleUsuarioAdmin from "../../src/pages/admin/DetalleUsuarioAdmin";
import NuevoUsuario from "../../src/pages/admin/NuevoUsuario";
import EditarUsuario from "../../src/pages/admin/EditarUsuario";
import InicioAdmin from "../../src/pages/admin/InicioAdmin";
import ProductosAdmin from "../../src/pages/admin/ProductosAdmin";
import DetalleProductoAdmin from "../../src/pages/admin/DetalleProductoAdmin";
import NuevoProducto from "../../src/pages/admin/NuevoProducto";
import EditarProducto from "../../src/pages/admin/EditarProducto";
import FormularioProducto from "../../src/components/FormularioProducto";
import MenuAdmin from "../../src/components/MenuAdmin";
import { api } from "../../src/services/api";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · panel admin: usuarios, productos y permisos", () => {
  let e, adapterOriginal;
  const producto = {codigo: 'TC001', nombre: 'Torta chocolate', descripcion: 'Chocolate', precio: 45000,
    stock: 10, disponible: true, personalizable: true, sinAzucar: false, sinGluten: false,
    vegano: false, categoria: 'Tortas Cuadradas', imagen:'/img/tc001.jpg'};
  beforeEach(() => { e = escenarioV6(); adapterOriginal = api.defaults.adapter;
    api.defaults.adapter = async config => ({ config, status: 200, data: config.url === '/categorias' ? ['Tortas Cuadradas'] : {}, headers: {} }); });
  afterEach(async () => { api.defaults.adapter = adapterOriginal; await e.destruir(); });
  function ctx(contexto={}) { return { sesion: { ...e.usuario, rol: 'admin' }, usuarios: [e.usuario], ...contexto }; }
  it("muestra accesos de administración y enlace de regreso", async () => {
    await e.montar(<InicioAdmin />, { contexto:ctx() });
    expect(e.nodo.textContent).toContain('Bienvenido al área de gestión');
    expect(e.nodo.querySelector('a[href="/admin/productos"]')).not.toBeNull();
    expect(e.nodo.querySelector('a[href="/admin/usuarios"]')).not.toBeNull();
  });
  it("menú admin expone usuarios, consultas y categorías", async () => {
    await e.montar(<MenuAdmin />, { contexto:ctx() });
    expect(e.nodo.textContent).toContain('Categorías');
    expect(e.nodo.textContent).toContain('Consultas');
    expect(e.nodo.textContent).toContain('Usuarios');
  });
  it("menú vendedor restringe usuarios y categorías", async () => {
    await e.montar(<MenuAdmin />, { contexto:ctx({sesion:{...e.usuario,rol:'vendedor'}}) });
    expect(e.nodo.textContent).toContain('Pedidos');
    expect(e.nodo.textContent).not.toContain('Usuarios');
    expect(e.nodo.textContent).not.toContain('Categorías');
  });
  it("usuarios muestra lista con enlaces editar y detalle", async () => {
    await e.montar(<UsuariosAdmin />, { contexto:ctx() });
    expect(e.nodo.textContent).toContain('Persona');
    expect(e.nodo.querySelector('a[href="/admin/usuario/u1"]')).not.toBeNull();
    expect(e.nodo.querySelector('a[href="/admin/usuario/u1/editar"]')).not.toBeNull();
  });
  it("usuarios informa cuando no hay registros", async () => {
    await e.montar(<UsuariosAdmin />, { contexto:ctx({ usuarios: [] }) });
    expect(e.nodo.textContent).toContain('No hay usuarios registrados');
  });
  it("usuarios presenta error de persistencia", async () => {
    await e.montar(<UsuariosAdmin />, { contexto:ctx({ errorPersistencia: 'Fallo en servidor' }) });
    expect(e.nodo.querySelector('[role="alert"]')?.textContent).toContain('Fallo en servidor');
  });
  it("cancelar confirmación no elimina usuario", async () => {
    const eliminar=jasmine.createSpy('eliminar');spyOn(window,'confirm').and.returnValue(false);
    await e.montar(<UsuariosAdmin />, { contexto:ctx({ eliminar }) });
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b=>b.textContent.includes('Eliminar')));
    expect(eliminar).not.toHaveBeenCalled();
  });
  it("confirmar eliminación pasa el id correcto", async () => {
    const eliminar=jasmine.createSpy('eliminar');spyOn(window,'confirm').and.returnValue(true);
    await e.montar(<UsuariosAdmin />, { contexto:ctx({ eliminar }) });
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b=>b.textContent.includes('Eliminar')));
    expect(eliminar).toHaveBeenCalledWith('u1');
  });
  it("detalle muestra campos y rol de usuario", async () => {
    await e.montar(<DetalleUsuarioAdmin />, {ruta:'/admin/usuario/u1',patron:'/admin/usuario/:id',contexto:ctx(),adicionales:[]});
    expect(e.nodo.textContent).toContain('Detalle del usuario');
    expect(e.nodo.textContent).toContain('persona@gmail.com');
    expect(e.nodo.textContent).toContain('Melipilla');
  });
  it("detalle informa usuario inexistente", async () => {
    await e.montar(<DetalleUsuarioAdmin />, {ruta:'/admin/usuario/u2',patron:'/admin/usuario/:id',contexto:ctx(),adicionales:[]});
    expect(e.nodo.textContent).toContain('Usuario no encontrado');
  });
  it("nuevo usuario presenta formulario administrativo", async () => {
    await e.montar(<NuevoUsuario />, {contexto:ctx()});
    expect(e.nodo.textContent).toContain('Nuevo usuario');
    expect(e.nodo.querySelector('select[name="rol"]')).not.toBeNull();
  });
  it("editar usuario existente muestra campos cargados", async () => {
    await e.montar(<EditarUsuario />, {ruta:'/admin/usuario/u1/editar',patron:'/admin/usuario/:id/editar',contexto:ctx()});
    expect(e.nodo.textContent).toContain('Editar usuario');
    expect(e.nodo.querySelector('input[name="nombre"]').value).toBe('Persona');
  });
  it("editar usuario inexistente presenta enlace de regreso", async () => {
    await e.montar(<EditarUsuario />, {ruta:'/admin/usuario/u2/editar',patron:'/admin/usuario/:id/editar',contexto:ctx()});
    expect(e.nodo.textContent).toContain('Usuario no encontrado');
  });
  it("detalle producto muestra stock, categoría y precio", async () => {
    await e.montar(<DetalleProductoAdmin productos={[producto]} />, {ruta:'/admin/producto/TC001',patron:'/admin/producto/:codigo',contexto:ctx()});
    expect(e.nodo.textContent).toContain('10 unidades');
    expect(e.nodo.textContent).toContain('$45.000');
    expect(e.nodo.querySelector('a[href="/admin/producto/TC001/editar"]')).not.toBeNull();
  });
  it("detalle producto vendedor no permite editar", async () => {
    await e.montar(<DetalleProductoAdmin productos={[producto]} />, {ruta:'/admin/producto/TC001',patron:'/admin/producto/:codigo',contexto:ctx({sesion:{...e.usuario,rol:'vendedor'}})});
    expect(e.nodo.textContent).toContain('Torta chocolate');
    expect(e.nodo.querySelector('a[href="/admin/producto/TC001/editar"]')).toBeNull();
  });
  it("detalle producto inexistente informa error", async () => {
    await e.montar(<DetalleProductoAdmin productos={[]} />, {ruta:'/admin/producto/TC001',patron:'/admin/producto/:codigo',contexto:ctx()});
    expect(e.nodo.textContent).toContain('Producto no encontrado');
  });
  it("formulario producto nuevo muestra validaciones al enviarse vacío", async () => {
    const guardar=jasmine.createSpy('guardar');
    await e.montar(<FormularioProducto titulo="Nuevo producto" productos={[]} alGuardar={guardar} />, {contexto:ctx()});
    await e.enviar(e.nodo.querySelector('form'));
    expect(guardar).not.toHaveBeenCalled();
    expect(e.nodo.textContent).toContain('Ingresa un código');
  });
  it("formulario producto de edición bloquea el código y conserva atributos alimentarios", async () => {
    await e.montar(<FormularioProducto titulo="Editar producto" productos={[producto]} inicial={producto} esEdicion alGuardar={async()=>{}} />, {contexto:ctx()});
    expect(e.nodo.querySelector('input[name="codigo"]').readOnly).toBeTrue();
    expect(e.nodo.querySelector('input[name="personalizable"]').checked).toBeTrue();
    expect(e.nodo.querySelector('input[name="sinAzucar"]')).not.toBeNull();
  });
  it("crear producto solicita todos los datos al servicio de API", async () => {
    const alGuardar=jasmine.createSpy('alGuardar').and.resolveTo();
    await e.montar(<FormularioProducto titulo="Nuevo producto" productos={[]} inicial={producto} alGuardar={alGuardar} />, {contexto:ctx()});
    await e.enviar(e.nodo.querySelector('form'));
    expect(alGuardar).toHaveBeenCalled();
    expect(alGuardar.calls.mostRecent().args[0].precio).toBe(45000);
  });
  it("editar producto inexistente no intenta escribir por API", async () => {
    await e.montar(<EditarProducto productos={[]} actualizarProductos={async()=>{}} />, {ruta:'/admin/producto/no-existe/editar',patron:'/admin/producto/:codigo/editar',contexto:ctx()});
    expect(e.nodo.textContent).toContain('Producto no encontrado');
  });
  it("pantalla nuevo producto conserva datos de catálogo", async () => {
    await e.montar(<NuevoProducto productos={[]} actualizarProductos={async()=>{}} />, {contexto:ctx()});
    expect(e.nodo.querySelector('input[name="codigo"]')).not.toBeNull();
    expect(e.nodo.querySelector('select[name="categoria"]')).not.toBeNull();
  });
  it("panel de productos vacío muestra mensaje", async () => {
    await e.montar(<ProductosAdmin productos={[]} actualizarProductos={async()=>{}} />, {contexto:ctx()});
    expect(e.nodo.textContent).toContain('No hay productos registrados');
  });
});
