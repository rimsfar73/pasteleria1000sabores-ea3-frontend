import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { api, mensajeError } from "../services/api";
import { regionesComunas, normalizarRegion } from "../data/regionesComunas";
import { formatoPrecio } from "../utils/formatoPrecio";

/**
 * Conserva los campos de entrega del checkout EA2, pero el precio, inventario,
 * descuento e IVA se calculan EXCLUSIVAMENTE en Spring Boot.
 * El snapshot de la cotización impide confirmar otra solicitud silenciosamente.
 */
export default function Checkout({ sesion = {}, carrito = [], codigoCupon = "",
  vaciarCarrito = () => {}, actualizarProductos = async () => {} }) {
  const [datos, setDatos] = useState({
    nombre: [sesion.nombre, sesion.apellidos].filter(Boolean).join(" "),
    correo: sesion.correo || "",
    telefono: "", direccion: sesion.direccion || "", numero: "",
    region: normalizarRegion(sesion.region || ""), comuna: sesion.comuna || "",
    observaciones: "",
    resultadoPago: "APROBADO", // Simulación académica: sin transacción financiera.
  });
  const [cotizacion, setCotizacion] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const clave = useRef(null);
  const bloqueado = useRef(false);

  const solicitud = () => ({
    direccion: datos.direccion.trim(), region: datos.region, comuna: datos.comuna,
    nombreReceptor: datos.nombre.trim(), correoReceptor: datos.correo.trim(),
    telefono: datos.telefono.trim(), numero: datos.numero.trim(),
    observaciones: datos.observaciones.trim(), cupon: codigoCupon || "",
    resultadoPago: datos.resultadoPago,
    items: carrito.map(p => ({ codigo: p.codigo, cantidad: p.cantidad })),
  });
  const firmaActual = JSON.stringify(solicitud());
  const cotizacionVigente = Boolean(cotizacion && cotizacion.firma === firmaActual);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos(d => ({ ...d, [name]: value, ...(name === "region" ? { comuna: "" } : {}) }));
    setCotizacion(null);
    clave.current = null;
    setError("");
  }

  async function cotizar(evento) {
    evento.preventDefault();
    if (bloqueado.current || !carrito.length) return;
    bloqueado.current = true;
    setOcupado(true);
    setError("");
    const datosCotizados = solicitud();
    try {
      const { data } = await api.post("/pedidos/cotizar", datosCotizados);
      setCotizacion({ respuesta: data, solicitud: datosCotizados, firma: JSON.stringify(datosCotizados) });
      clave.current = crypto.randomUUID();
    } catch (e) {
      setCotizacion(null);
      setError(mensajeError(e));
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  async function confirmar() {
    if (bloqueado.current || !cotizacion || !cotizacionVigente) {
      setError("La compra cambió desde la cotización. Debes consultar nuevamente.");
      setCotizacion(null);
      return;
    }
    bloqueado.current = true;
    setOcupado(true);
    setError("");
    try {
      const { data } = await api.post("/pedidos", {
        ...cotizacion.solicitud,
        totalEsperado: cotizacion.respuesta.total,
      }, { headers: { "Idempotency-Key": clave.current } });
      setPedido(data);
      vaciarCarrito();
      try { await actualizarProductos(); } catch { /* El pedido ya fue confirmado en BD. */ }
    } catch (e) {
      setError(mensajeError(e));
      if (e.response?.status === 409) { setCotizacion(null); clave.current = null; }
      // 422 es el camino de demostración de pago rechazado. Conserva carrito y cotización.
      try { await actualizarProductos(); } catch { /* Refresco no crítico. */ }
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  if (pedido) return <Container className="py-5">
    <Alert variant="success" role="status"><h1>Pedido confirmado</h1>
      <p>Número: {pedido.id}</p><p>Total: {formatoPrecio(pedido.total)}</p>
      <p>Neto: {formatoPrecio(pedido.totalNeto)} · IVA incluido: {formatoPrecio(pedido.totalIva)}</p>
      <Link to={`/pedidos/${pedido.id}`}>Ver pedido</Link>
      <p className="mt-2">No se ha realizado ningún cobro real: compra académica simulada.</p>
    </Alert>
  </Container>;

  if (!carrito.length) return <Container className="py-5"><Alert variant="warning">
    Tu carrito está vacío. <Link to="/productos">Ir al catálogo</Link>
  </Alert></Container>;

  return <Container className="py-5">
    <h1 className="mb-4">Finalizar compra</h1>
    <Row className="g-4"><Col lg={7}>
      <Card><Card.Body><h2 className="h4 mb-4">Datos de entrega</h2>
        <Form onSubmit={cotizar}>
          <Form.Group className="mb-3" controlId="checkout-nombre">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control name="nombre" value={datos.nombre} readOnly required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="checkout-correo">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control name="correo" type="email" value={datos.correo} readOnly required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="checkout-telefono">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control name="telefono" type="tel" value={datos.telefono} onChange={cambiar}
              pattern="[+0-9 ]{8,20}" placeholder="+56912345678" required />
          </Form.Group>
          <Row><Col md={8}><Form.Group className="mb-3" controlId="checkout-direccion">
            <Form.Label>Dirección</Form.Label>
            <Form.Control name="direccion" value={datos.direccion} onChange={cambiar} maxLength={255} required />
          </Form.Group></Col><Col md={4}><Form.Group className="mb-3" controlId="checkout-numero">
            <Form.Label>Número</Form.Label>
            <Form.Control name="numero" value={datos.numero} onChange={cambiar} maxLength={20} required />
          </Form.Group></Col></Row>
          <Row><Col md={6}><Form.Group className="mb-3" controlId="checkout-region">
            <Form.Label>Región</Form.Label>
            <Form.Select name="region" value={datos.region} onChange={cambiar} required>
              <option value="">Selecciona una región</option>
              {Object.keys(regionesComunas).map(r => <option key={r} value={r}>{r}</option>)}
            </Form.Select>
          </Form.Group></Col><Col md={6}><Form.Group className="mb-3" controlId="checkout-comuna">
            <Form.Label>Comuna</Form.Label>
            <Form.Select name="comuna" value={datos.comuna} onChange={cambiar} disabled={!datos.region} required>
              <option value="">Selecciona comuna</option>
              {(regionesComunas[datos.region] || []).map(c => <option key={c}>{c}</option>)}
            </Form.Select>
          </Form.Group></Col></Row>
          <Form.Group className="mb-3" controlId="checkout-observaciones">
            <Form.Label>Observaciones (opcional)</Form.Label>
            <Form.Control as="textarea" rows={3} name="observaciones" value={datos.observaciones}
              onChange={cambiar} maxLength={500} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="checkout-resultado-pago">
            <Form.Label>Resultado del pago (solo demostración)</Form.Label>
            <Form.Select name="resultadoPago" value={datos.resultadoPago} onChange={cambiar} required>
              <option value="APROBADO">Simular pago aprobado</option>
              <option value="RECHAZADO">Simular pago rechazado</option>
            </Form.Select>
            <Form.Text>La simulación no realiza cobros reales. El backend rechazará la compra sin descontar stock.</Form.Text>
          </Form.Group>
          <Button type="submit" disabled={ocupado}>Consultar total y stock</Button>
        </Form>
        {codigoCupon === "DUOC15" && !sesion.estudianteDuoc &&
          <Alert variant="warning" className="mt-3">El cupón DUOC requiere validación previa por un administrador.</Alert>}
        {error && <Alert variant="danger" role="alert" className="mt-3">{error}</Alert>}
        {cotizacion && !cotizacionVigente && <Alert variant="warning" className="mt-3">
          Cambió el carrito o el cupón: consulta nuevamente el total.
        </Alert>}
      </Card.Body></Card>
    </Col><Col lg={5}><Card><Card.Body><h2 className="h4 mb-3">Resumen de compra</h2>
      {carrito.map(p => <div key={p.codigo} className="d-flex justify-content-between gap-3 mb-2">
        <span>{p.nombre} × {p.cantidad}</span><span>{formatoPrecio(p.precio * p.cantidad)}</span>
      </div>)}
      <hr />
      {cotizacionVigente ? <>
        <p>Subtotal: {formatoPrecio(cotizacion.respuesta.subtotal)}</p>
        <p>Descuento: −{formatoPrecio(cotizacion.respuesta.descuento)}</p>
        <p>Neto sin IVA: {formatoPrecio(cotizacion.respuesta.totalNeto)}</p>
        <p>IVA incluido: {formatoPrecio(cotizacion.respuesta.totalIva)}</p>
        <strong>Total: {formatoPrecio(cotizacion.respuesta.total)}</strong>
        <p className="small text-muted">El servidor vuelve a validar precios, descuentos y stock al confirmar.</p>
        {datos.resultadoPago === "RECHAZADO" && <Alert variant="warning">
          Se demostrará un pago rechazado: la API responderá 422 y no creará un pedido.
        </Alert>}
        <Button type="button" variant="success" disabled={ocupado} onClick={confirmar}>
          Confirmar pedido
        </Button>
      </> : <p>Confirma tus datos para obtener la cotización definitiva desde el servidor.</p>}
      <p className="small text-muted mt-3">No se realizan cobros reales.</p>
    </Card.Body></Card></Col></Row>
  </Container>;
}
