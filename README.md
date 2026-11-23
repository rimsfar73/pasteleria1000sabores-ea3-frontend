# 🍰 Pastelería 1000 Sabores — Frontend EA3

**Desarrollo Fullstack II | Duoc UC | 2026**

Aplicación web de comercio electrónico desarrollada con **React 19 y Vite 8**, integrada con una API REST en **Spring Boot 3.5.16** y persistencia mediante **PostgreSQL**.

El proyecto evoluciona desde EA1 y EA2 hacia una solución fullstack, incorporando autenticación, administración de productos y usuarios, inventario y procesamiento simulado de pedidos.

## Tecnologías

| Frontend | Backend e infraestructura |
|---|---|
| React 19 + Vite 8 | Java 21 + Spring Boot 3.5.16 |
| JavaScript / JSX | Spring Security + JWT |
| React Router | JPA / Hibernate |
| React Bootstrap | PostgreSQL 17 |
| Axios + Context API | H2 (perfil alternativo) |
| Karma + Jasmine + Istanbul | Flyway (migraciones SQL) |
| Oxlint | Swagger / OpenAPI |

## Arquitectura

```text
React + Vite
    │
    ├── Componentes, páginas y hooks
    ├── Context API
    │
    ▼
Axios / API REST
    │
    ▼
Spring Boot
    ├── Spring Security + JWT + CSRF
    ├── Controladores y servicios
    └── JPA / Hibernate
             │
             ▼
      PostgreSQL (principal)
      H2 (perfil alternativo)

Flyway → Migraciones del esquema
```

**PostgreSQL** es la base principal utilizada en EA3. **H2** dispone de un perfil de configuración alternativo, pendiente de validación integral.

**Flyway** gestiona las migraciones del backend:

- `V1__esquema.sql`: esquema inicial.
- `V2__trazabilidad_comercial_ea3.sql`: ampliación de trazabilidad comercial.

Ambas migraciones fueron validadas correctamente sobre PostgreSQL.

## Funcionalidades

- Catálogo, búsqueda, filtros y detalle de productos.
- Registro, autenticación y perfiles de usuario.
- Carrito, cupones y checkout.
- Cotización y simulación de pagos aprobados/rechazados.
- Gestión de pedidos.
- Panel administrativo para productos, usuarios y categorías.
- Control de inventario persistente en PostgreSQL.
- Blogs y formulario de contacto.
- Autorización por roles y protección de sesiones.

Las reglas comerciales críticas y la persistencia se ejecutan en Spring Boot, no en el navegador.

## Estructura

```text
frontend/
├── public/          # Imágenes y recursos públicos
├── src/
│   ├── components/  # Componentes reutilizables
│   ├── context/     # Contextos React
│   ├── data/        # Datos auxiliares
│   ├── hooks/       # Estado y lógica
│   ├── pages/       # Páginas públicas y admin
│   ├── services/    # Cliente Axios
│   └── utils/       # Validaciones y utilidades
├── test/            # Pruebas unitarias y de componentes
├── scripts/         # Automatización y cobertura
├── docs/            # Evidencias de calidad
├── Dockerfile
├── nginx.conf
└── package.json
```

## Instalación y ejecución

**Requisitos:** Node.js compatible con Vite 8, npm y backend Spring Boot para las funciones conectadas.

```bash
git clone https://github.com/rimsfar73/pasteleria1000sabores-ea3-frontend.git
cd pasteleria1000sabores-ea3-frontend
npm ci
```

Configurar `.env.development`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

Iniciar:

```bash
npm run dev
```

Generar compilación:

```bash
npm run build
```

## Pruebas y cobertura

Resultados verificados el **23/11/2026**:

| Indicador | Resultado |
|---|---:|
| Pruebas aprobadas | **246/246** |
| Sentencias | **88,26 %** |
| Ramas | **80,28 %** |
| Funciones | **86,77 %** |
| Líneas | **91,44 %** |
| Lint | **0 errores** |
| Build | **Exitoso** |

```bash
npm run lint
npm run build
npm run test:coverage
```

Las cuatro métricas de cobertura superan el umbral del 80 %.

Informe: `docs/INFORME_COBERTURA_EA3_GENERADO.md`.

## Estado de integración

**Verificado:** autenticación administrativa, catálogo, modificación de inventario desde React y persistencia en PostgreSQL.

**Pendiente de auditoría integral:** CRUD completo de productos y usuarios, checkout aprobado/rechazado y pruebas negativas de autorización.

## Equipo

**Duoc UC — Desarrollo Fullstack II**

- Christian Quiroz Roa
- Rimsky Farías Soto

## Repositorios

- **Frontend:** https://github.com/rimsfar73/pasteleria1000sabores-ea3-frontend
- **Backend:** https://github.com/rimsfar73/pasteleria1000sabores-ea3-backend

---

*Proyecto académico con fines de aprendizaje y demostración. No procesa pagos reales.*
