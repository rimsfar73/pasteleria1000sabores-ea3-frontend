
import { act, useEffect } from "react";
import { UsuariosProvider } from "../../src/hooks/useUsuarios.jsx";
import { useUsuarios } from "../../src/hooks/useUsuarios.js";
import { api, establecerToken } from "../../src/services/api";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · CRUD de cuentas contra API y sesión de usuario", () => {
  let e;
  let previo;
  let peticiones;
  let resolver;
  let estado;

  const ok = (config, data) => ({
    status: 200,
    headers: {},
    config,
    data,
  });

  function Observador() {
    const u = useUsuarios();

    useEffect(() => {
      estado = u;
    }, [u]);

    return <p>{u.sesion?.nombre || "Sin sesión"}</p>;
  }

  async function levantar() {
    await e.montar(
      <UsuariosProvider>
        <Observador />
      </UsuariosProvider>
    );
  }

  beforeEach(() => {
    e = escenarioV6();
    estado = null;
    previo = api.defaults.adapter;
    peticiones = [];

    // Restablecer la sesión antes de cada prueba.
    establecerToken("restablecer-tests");
    establecerToken(null);
    localStorage.removeItem("ea3-sesion-cerrada");

    resolver = (config) =>
      ok(
        config,
        config.url === "/auth/refresh"
          ? { accessToken: "token-prueba", usuario: e.usuario }
          : []
      );

    api.defaults.adapter = async (config) => {
      peticiones.push(config);

      if (config.url === "/auth/csrf") {
        return ok(config, { token: "csrf" });
      }

      return resolver(config);
    };
  });

  afterEach(async () => {
    await e.destruir();
    api.defaults.adapter = previo;
    establecerToken(null);
  });

  it("recupera sesión del navegador mediante refresh", async () => {
    await levantar();

    // Verifica que el provider complete la recuperación.
    // No depende de capturar un evento global.
    await act(async () => {
      for (let intento = 0; intento < 20; intento++) {
        if (estado?.sesion?.id === "u1") {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });

    expect(
      peticiones.some((config) => config.url === "/auth/refresh")
    ).toBeTrue();

    expect(estado?.sesion?.id).toBe("u1");

    expect(e.nodo.textContent).toContain("Persona");
  });

  it("registro cliente utiliza endpoint público", async () => {
    resolver = (config) =>
      ok(
        config,
        config.url === "/auth/refresh"
          ? { accessToken: "nuevo", usuario: e.usuario }
          : { id: "u2", nombre: "Nuevo" }
      );

    await levantar();

    let resultado;

    await act(async () => {
      resultado = await estado.crear({
        nombre: "Nuevo",
        correo: "nuevo@gmail.com",
      });
    });

    expect(resultado.ok).toBeTrue();

    expect(
      peticiones.some(
        (config) =>
          config.url === "/auth/register" &&
          config.method === "post"
      )
    ).toBeTrue();
  });

  it("alta administrativa utiliza /usuarios", async () => {
    resolver = (config) =>
      ok(
        config,
        config.url === "/auth/refresh"
          ? { accessToken: "nuevo", usuario: e.usuario }
          : { id: "u2", nombre: "Vendedor", rol: "vendedor" }
      );

    await levantar();

    let resultado;

    await act(async () => {
      resultado = await estado.crear(
        { nombre: "Vendedor" },
        { desdeAdmin: true }
      );
    });

    expect(resultado.ok).toBeTrue();

    expect(
      peticiones.some(
        (config) =>
          config.url === "/usuarios" &&
          config.method === "post"
      )
    ).toBeTrue();
  });

  it("edita otro usuario con PUT sin cerrar sesión propia", async () => {
    resolver = (config) =>
      ok(
        config,
        config.url === "/auth/refresh"
          ? { accessToken: "nuevo", usuario: e.usuario }
          : { id: "u2", nombre: "Cambiado", rol: "cliente" }
      );

    await levantar();

    let resultado;

    await act(async () => {
      resultado = await estado.actualizar("u2", {
        nombre: "Cambiado",
      });
    });

    expect(resultado.ok).toBeTrue();

    expect(
      peticiones.some(
        (config) =>
          config.url === "/usuarios/u2" &&
          config.method === "put"
      )
    ).toBeTrue();
  });

  it("elimina usuario mediante DELETE en backend", async () => {
    await levantar();

    let resultado;

    await act(async () => {
      resultado = await estado.eliminar("u2");
    });

    expect(resultado).toBeTrue();

    expect(
      peticiones.some(
        (config) =>
          config.url === "/usuarios/u2" &&
          config.method === "delete"
      )
    ).toBeTrue();
  });

  it("API devuelve errores por campo para formularios", async () => {
    resolver = (config) => {
      if (config.url === "/auth/refresh") {
        return ok(config, {
          accessToken: "nuevo",
          usuario: e.usuario,
        });
      }

      return Promise.reject(
        Object.assign(new Error("Error 400"), {
          config,
          response: {
            status: 400,
            data: {
              mensaje: "Corrige formulario",
              errores: {
                correo: "Duplicado",
              },
            },
          },
        })
      );
    };

    await levantar();

    let resultado;

    await act(async () => {
      resultado = await estado.crear({
        correo: "duplicado@gmail.com",
      });
    });

    expect(resultado.ok).toBeFalse();
    expect(resultado.errores.correo).toBe("Duplicado");

    expect(estado.errorPersistencia).toContain(
      "Corrige formulario"
    );
  });
});
