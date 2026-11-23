
import { validarContacto } from "../../src/utils/validarContacto";

describe("validarContacto", () => {
  const datosValidos = {
    nombre: "Ejemplo",
    correo: "a@gmail.com",
    comentario: "Consulta"
  };

  it("acepta consulta válida", () => {
    expect(validarContacto(datosValidos).valido).toBe(true);
  });

  it("rechaza comentario vacío", () => {
    expect(validarContacto({
      ...datosValidos,
      comentario: ""
    }).valido).toBe(false);
  });

  it("rechaza correo externo", () => {
    expect(validarContacto({
      ...datosValidos,
      correo: "a@otro.com"
    }).valido).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    const resultado = validarContacto({
      ...datosValidos,
      nombre: ""
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.errores.nombre).toBeDefined();
  });

  it("rechaza nombres superiores a 100 caracteres", () => {
    const resultado = validarContacto({
      ...datosValidos,
      nombre: "A".repeat(101)
    });

    expect(resultado.errores.nombre).toBeDefined();
  });

  it("rechaza comentarios superiores a 500 caracteres", () => {
    const resultado = validarContacto({
      ...datosValidos,
      comentario: "A".repeat(501)
    });

    expect(resultado.errores.comentario).toBeDefined();
  });

  it("rechaza datos obligatorios ausentes", () => {
    const resultado = validarContacto({});

    expect(resultado.valido).toBe(false);
    expect(resultado.errores.nombre).toBeDefined();
    expect(resultado.errores.correo).toBeDefined();
    expect(resultado.errores.comentario).toBeDefined();
  });

  it("permite el correo del administrador inicial únicamente con su sesión", () => {
    const datos = {
      ...datosValidos,
      correo: "admin@pasteleria.cl"
    };

    const sesionAdmin = {
      id: "admin-ea2-001",
      correo: "admin@pasteleria.cl"
    };

    expect(validarContacto(datos, sesionAdmin).valido).toBe(true);
    expect(validarContacto(datos, null).valido).toBe(false);
  });

  it("rechaza la excepción administrativa cuando el ID no corresponde", () => {
    const resultado = validarContacto(
      {
        ...datosValidos,
        correo: "admin@pasteleria.cl"
      },
      {
        id: "otro-usuario",
        correo: "admin@pasteleria.cl"
      }
    );

    expect(resultado.errores.correo).toBeDefined();
  });
});
