> **Versión integrada EA3 v4 (candidata).** Este archivo proviene del ZIP de Chris y puede contener instrucciones anteriores. La guía vigente está en `../docs/ARRANQUE-V4.md`; la trazabilidad en `../docs/TRAZABILIDAD-ORACLE-EA2-JAVA-V4.md`. Los tests nuevos requieren ejecución independiente.

---

# Frontend EA3 — Pastelería Mil Sabores

React + Vite + Axios. Este proyecto se ejecuta de forma independiente del backend.

```powershell
npm.cmd ci
$env:VITE_API_URL = "http://localhost:8080/api/v1"
npm.cmd run dev
```

Comprobaciones: `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd test`.
Cobertura completa de src (excluye únicamente el arranque main.jsx): `npm.cmd run test:coverage`.
Reporte: `coverage/html/index.html`. No se afirma un 80% que las pruebas actuales no alcanzan.

Para iniciar todo automáticamente, leer `../LEEME-PRIMERO.md`.
La documentación EA2 original se conserva en `../docs/historial-ea2` como referencia histórica; no describe la arquitectura EA3.
