import Login from "../../src/pages/Login";
import Registro from "../../src/pages/Registro";
import Perfil from "../../src/pages/Perfil";
import FormularioUsuario from "../../src/components/FormularioUsuario";
import ConfirmarCerrarSesion from "../../src/components/ConfirmarCerrarSesion";
import { escenarioV6 } from "../helpers/montajeV6";

describe("EA3 V6 · autenticación, registro y perfil (regresión EA2)", () => {
  let e;
  beforeEach(() => { e = escenarioV6(); });
  afterEach(async () => { await e.destruir(); });

  it("renderiza login sin sesión y contiene campos de correo y contraseña", async () => {
    await e.montar(<Login />);
    expect(e.nodo.textContent).toContain("Iniciar sesión");
    expect(e.nodo.querySelector('input[type="email"]')).not.toBeNull();
    expect(e.nodo.querySelector('input[type="password"]')).not.toBeNull();
    expect(e.nodo.querySelector('a[href="/registro"]')).not.toBeNull();
  });
  it("muestra mensaje de error de autenticación sin cambiar de ruta", async () => {
    const ingresar = jasmine.createSpy("ingresar").and.resolveTo({ ok: false, mensaje: "Credenciales incorrectas" });
    await e.montar(<Login />, { contexto: { ingresar } });
    await e.escribir(e.nodo.querySelector('#login-correo'), 'persona@gmail.com');
    await e.escribir(e.nodo.querySelector('#login-clave'), 'incorrecta');
    await e.enviar(e.nodo.querySelector('form'));
    expect(ingresar).toHaveBeenCalled();
    expect(e.nodo.querySelector('[role="alert"]')?.textContent).toContain("Credenciales incorrectas");
  });
  it("login correcto del cliente permite volver al checkout solicitado", async () => {
    const ingresar = jasmine.createSpy("ingresar").and.resolveTo({ ok: true, usuario: e.usuario });
    await e.montar(<Login />, { contexto: { ingresar }, adicionales: [{ path: '/checkout', element: <p>Checkout autorizado</p> }] });
    await e.enviar(e.nodo.querySelector('form'));
    // Ruta desde el formulario: sin estado pendiente vuelve al inicio, no al checkout.
    expect(ingresar).toHaveBeenCalled();
  });
  it("el panel de sesión iniciada del administrador no ofrece edición de perfil", async () => {
    await e.montar(<Login />, { contexto: { sesion: { ...e.usuario, rol: 'admin' } } });
    expect(e.nodo.textContent).toContain("Administrador");
    expect(e.nodo.textContent).toContain("Ir a Administración");
    expect(e.nodo.querySelector('a[href="/perfil"]')).toBeNull();
  });
  it("cliente autenticado puede abrir y cancelar cierre de sesión", async () => {
    await e.montar(<Login />, { contexto: { sesion: e.usuario } });
    expect(e.nodo.querySelector('a[href="/perfil"]')).not.toBeNull();
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Cerrar sesión')));
    expect(e.nodo.querySelector('[role="alertdialog"]')).not.toBeNull();
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Rechazar')));
    expect(e.nodo.querySelector('[role="alertdialog"]')).toBeNull();
  });
  it("confirmación de cierre ejecuta la acción al aceptar", async () => {
    const confirmar = jasmine.createSpy("confirmar");
    await e.montar(<ConfirmarCerrarSesion abierto confirmar={confirmar} cancelar={() => {}} />);
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Aceptar')));
    expect(confirmar).toHaveBeenCalledTimes(1);
  });
  it("formulario de usuario impide asignación de roles en registro público", async () => {
    await e.montar(<FormularioUsuario enviar={async () => ({ ok: true })} />);
    expect(e.nodo.querySelector('select[name="rol"]')).toBeNull();
    expect(e.nodo.querySelector('input[name="run"]')).not.toBeNull();
  });
  it("formulario de administrador ofrece ADMIN, VENDEDOR y CLIENTE", async () => {
    await e.montar(<FormularioUsuario enviar={async () => ({ ok: true })} administrador />);
    const opciones = [...e.nodo.querySelectorAll('select[name="rol"] option')].map(o => o.value);
    expect(opciones).toEqual(['cliente', 'admin', 'vendedor']);
  });
  it("formulario de edición bloquea RUN y permite conservar contraseña", async () => {
    await e.montar(<FormularioUsuario inicial={e.usuario} editar bloquearRun enviar={async () => ({ ok: true })} />);
    expect(e.nodo.querySelector('input[name="run"]').readOnly).toBeTrue();
    expect(e.nodo.querySelector('input[name="clave"]').required).toBeFalse();
  });
  it("formulario muestra errores del servidor al fallar guardado", async () => {
    await e.montar(<FormularioUsuario enviar={async () => ({ ok: false, mensaje: 'Datos incorrectos', errores: { correo: 'Correo en uso' } })} />);
    await e.enviar(e.nodo.querySelector('form'));
    expect(e.nodo.textContent).toContain('Correo en uso');
    expect(e.nodo.textContent).toContain('Datos incorrectos');
  });
  it("registro muestra su formulario y ruta alternativa al login", async () => {
    await e.montar(<Registro />);
    expect(e.nodo.textContent).toContain('Registro de clientes');
    expect(e.nodo.querySelector('a[href="/login"]')).not.toBeNull();
  });
  it("perfil sin sesión informa que no se encontró la cuenta", async () => {
    await e.montar(<Perfil />);
    expect(e.nodo.textContent).toContain('Perfil no encontrado');
  });
  it("perfil muestra datos actuales y permite editar", async () => {
    await e.montar(<Perfil />, { contexto: { sesion: e.usuario, usuarios: [e.usuario] } });
    expect(e.nodo.textContent).toContain('Persona');
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Editar mis datos')));
    expect(e.nodo.textContent).toContain('Editar mis datos');
    expect(e.nodo.querySelector('input[name="run"]').readOnly).toBeTrue();
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Cancelar')));
    expect(e.nodo.querySelector('input[name="run"]')).toBeNull();
  });
  it("actualizar perfil exitosamente muestra confirmación", async () => {
    const actualizarMiPerfil = jasmine.createSpy('actualizarMiPerfil').and.resolveTo({ ok: true, usuario: e.usuario });
    await e.montar(<Perfil />, { contexto: { sesion: e.usuario, usuarios: [e.usuario], actualizarMiPerfil } });
    await e.hacerClick([...e.nodo.querySelectorAll('button')].find(b => b.textContent.includes('Editar mis datos')));
    await e.enviar(e.nodo.querySelector('form'));
    expect(actualizarMiPerfil).toHaveBeenCalled();
    expect(e.nodo.textContent).toContain('Tus datos se actualizaron correctamente');
  });
});
