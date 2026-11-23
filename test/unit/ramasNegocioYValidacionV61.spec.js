import { validarDatosProducto } from "../../src/utils/validarDatosProducto";
import { validarUsuario, correoValido, runValido } from "../../src/utils/validarUsuario";
import { permiteCantidad, permiteAgregar } from "../../src/utils/stockCarrito";
import { validarCupon } from "../../src/utils/validarCupon";
import { usuarioMock } from "../mocks/usuarios";

// Pruebas de decisiones comerciales y caminos de error que no cubrían los
// casos felices de EA2. NO modifican archivos de producción ni configuración.
const producto = {
  codigo: "TC999", nombre: "Torta nueva", descripcion: "Chocolate",
  categoria: "Tortas Cuadradas", precio: "12000", stock: "4",
  imagen: "/img/torta.jpg", disponible: true,
};
const articulo = { codigo: "TC999", disponible: true, stock: 3 };

describe("EA3 v6.1 · validaciones de producto y stock (ramas negativas)", () => {
  it("no permite crear producto sin código", () => {
    expect(validarDatosProducto({ ...producto, codigo: undefined }).errores.codigo).toBeDefined();
  });
  it("rechaza códigos con espacios o caracteres especiales", () => {
    expect(validarDatosProducto({ ...producto, codigo: "TC 999" }).errores.codigo).toBeDefined();
    expect(validarDatosProducto({ ...producto, codigo: "TC/999" }).valido).toBeFalse();
  });
  it("rechaza nombre o descripción vacíos", () => {
    expect(validarDatosProducto({ ...producto, nombre: "   " }).errores.nombre).toBeDefined();
    expect(validarDatosProducto({ ...producto, descripcion: null }).errores.descripcion).toBeDefined();
  });
  it("rechaza precio ausente, textual y fraccionario", () => {
    for (const precio of ["", "no-numérico", "12.5"]) {
      expect(validarDatosProducto({ ...producto, precio }).errores.precio).toBeDefined();
    }
  });
  it("rechaza stock ausente, negativo, fraccionario o fuera de rango seguro", () => {
    for (const stock of ["", "-1", "1.5", "9007199254740992"]) {
      expect(validarDatosProducto({ ...producto, stock }).errores.stock).toBeDefined();
    }
  });
  it("rechaza rutas de imagen inseguras pero acepta HTTP y HTTPS", () => {
    expect(validarDatosProducto({ ...producto, imagen: "file:///etc/passwd" }).errores.imagen).toBeDefined();
    expect(validarDatosProducto({ ...producto, imagen: "https://example.org/torta.png" }).valido).toBeTrue();
    expect(validarDatosProducto({ ...producto, imagen: "http://example.org/torta.png" }).valido).toBeTrue();
  });
  it("permite imagen opcional y transforma flags alimentarios", () => {
    const r = validarDatosProducto({ ...producto, imagen: "", sinAzucar: true, sinGluten: 1, vegano: false });
    expect(r.valido).toBeTrue();
    expect(r.producto.sinAzucar).toBeTrue();
    expect(r.producto.sinGluten).toBeTrue();
    expect(r.producto.vegano).toBeFalse();
  });
  it("ignora producto inexistente o deshabilitado al validar stock", () => {
    expect(permiteCantidad(null, 1)).toBeFalse();
    expect(permiteCantidad({ ...articulo, disponible: false }, 1)).toBeFalse();
  });
  it("rechaza stock negativo o no entero", () => {
    expect(permiteCantidad({ ...articulo, stock: -1 }, 1)).toBeFalse();
    expect(permiteCantidad({ ...articulo, stock: 2.5 }, 1)).toBeFalse();
  });
  it("rechaza cantidad cero, fraccionaria y superior a existencias", () => {
    expect(permiteCantidad(articulo, 0)).toBeFalse();
    expect(permiteCantidad(articulo, 1.5)).toBeFalse();
    expect(permiteCantidad(articulo, 4)).toBeFalse();
  });
  it("acepta exactamente el stock disponible", () => {
    expect(permiteCantidad(articulo, 3)).toBeTrue();
  });
  it("no agrega un producto inexistente ni uno agotado en el carrito", () => {
    expect(permiteAgregar([], null)).toBeFalse();
    expect(permiteAgregar([{codigo:"TC999",cantidad:3}], articulo)).toBeFalse();
  });
  it("toma en cuenta la cantidad existente y admite un nuevo producto", () => {
    expect(permiteAgregar([{codigo:"TC999",cantidad:2}], articulo)).toBeTrue();
    expect(permiteAgregar([], articulo)).toBeTrue();
  });
});

describe("EA3 v6.1 · validación de identidad y beneficios comerciales", () => {
  it("rechaza correos nulos, formatos inválidos y dominios no autorizados", () => {
    expect(correoValido(null)).toBeFalse();
    expect(correoValido("sin-arroba")).toBeFalse();
    expect(correoValido("a@otro.cl")).toBeFalse();
  });
  it("normaliza correo con espacios y mayúsculas", () => {
    expect(correoValido("  PERSONA@GMAIL.COM ")).toBeTrue();
  });
  it("rechaza RUN incompleto y DV erróneo", () => {
    expect(runValido(null)).toBeFalse();
    expect(runValido("12345K")).toBeFalse();
    expect(runValido("123456786")).toBeFalse();
  });
  it("rechaza nombres y apellidos mayores al máximo", () => {
    expect(validarUsuario({ ...usuarioMock, nombre: "A".repeat(51) }).errores.nombre).toBeDefined();
    expect(validarUsuario({ ...usuarioMock, apellidos: "B".repeat(101) }).errores.apellidos).toBeDefined();
  });
  it("rechaza dirección demasiado larga y región desconocida", () => {
    expect(validarUsuario({ ...usuarioMock, direccion: "C".repeat(301) }).errores.direccion).toBeDefined();
    expect(validarUsuario({ ...usuarioMock, region: "Región inventada" }).errores.region).toBeDefined();
  });
  it("rechaza correo duplicado con otro identificador", () => {
    const otro = { ...usuarioMock, id: "distinto" };
    expect(validarUsuario(usuarioMock, [otro], "demo1").errores.correo).toBeDefined();
  });
  it("rechaza RUN duplicado con otro identificador", () => {
    const otro = { ...usuarioMock, id: "distinto", correo: "otro@gmail.com" };
    expect(validarUsuario(usuarioMock, [otro], "demo1").errores.run).toBeDefined();
  });
  it("permite edición sin clave, pero valida una clave nueva", () => {
    expect(validarUsuario({ ...usuarioMock, clave:"", confirmacion:"" }, [], "demo1", {exigirClave:false}).valido).toBeTrue();
    expect(validarUsuario({ ...usuarioMock, clave:"corta", confirmacion:"corta" }, [], "demo1", {exigirClave:false}).errores.clave).toBeDefined();
  });
  it("impide que un usuario nuevo se atribuya la cuenta semilla", () => {
    expect(validarUsuario({ ...usuarioMock, correo: "admin@pasteleria.cl" }).errores.correo).toBeDefined();
  });
  it("rechaza cupón no textual y subtotal Infinity", () => {
    expect(validarCupon(null, 10000).valido).toBeFalse();
    expect(validarCupon("PASTEL10", Infinity).valido).toBeFalse();
  });
  it("un cupón fijo conserva el total sin permitir saldo negativo", () => {
    const r = validarCupon("MIL5000", 30000);
    expect(r.valido).toBeTrue();
    expect(r.descuento).toBe(5000);
    expect(r.total).toBe(25000);
  });
});
