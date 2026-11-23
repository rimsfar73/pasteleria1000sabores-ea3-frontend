# 🍰 Pastelería 1000 Sabores — Frontend EA3

### Desarrollo Fullstack II · Duoc UC

Aplicación web de comercio electrónico desarrollada con **React y Vite**, integrada con una API REST construida en **Spring Boot** y una base de datos **PostgreSQL**.

El proyecto corresponde a la evolución de Pastelería 1000 Sabores desde la EA1 y EA2 hacia una aplicación fullstack, incorporando autenticación segura, administración de productos y usuarios, gestión de inventario, carrito de compras y procesamiento simulado de pedidos.

---

## 1. Descripción del proyecto

Pastelería 1000 Sabores es una plataforma de comercio electrónico orientada a la venta de productos de pastelería.

El sistema contempla dos áreas principales:

**Tienda pública**
- Página de inicio y catálogo de productos.
- Búsqueda, filtros y visualización de detalles.
- Registro e inicio de sesión.
- Carrito de compras.
- Cotización y confirmación de pedidos.
- Aplicación de cupones de descuento.
- Simulación académica de pagos aprobados y rechazados.
- Perfil de usuario e historial de pedidos.
- Blogs, información institucional y formulario de contacto.

**Panel de administración**
- Gestión de productos.
- Administración de usuarios.
- Control de inventario y disponibilidad.
- Gestión de categorías.
- Visualización de consultas.
- Acceso restringido según roles.

El frontend consume datos del backend mediante Axios. Los procesos comerciales críticos, como cálculos de precios, descuentos, impuestos y validación de stock, se realizan en el servidor.

## 2. Tecnologías utilizadas

| Tecnología | Aplicación |
|---|---|
| React 19 | Interfaz basada en componentes |
| Vite 8 | Entorno de desarrollo y compilación |
| JavaScript / JSX | Lógica de presentación |
| React Router | Navegación y rutas |
| React Bootstrap | Componentes de interfaz |
| Axios | Comunicación HTTP con API REST |
| Karma + Jasmine | Pruebas automatizadas |
| Istanbul | Cobertura de código |
| Oxlint | Análisis estático |
| Git y GitHub | Control de versiones |

**Backend complementario:** Spring Boot, Java 21, Spring Security, JWT, JPA, Flyway y PostgreSQL.

## 3. Arquitectura

```text
                 USUARIO
                    |
                    v
             REACT + VITE
                    |
        Componentes / Páginas
                    |
          Hooks y Context API
                    |
              Axios HTTP
                    |
                    v
              API REST
              Spring Boot
                    |
        Seguridad y servicios
                    |
                 JPA
                    |
                    v
               PostgreSQL
```

La arquitectura mantiene responsabilidades diferenciadas:

- **Frontend:** interfaz, navegación, formularios y estado de presentación.
- **Backend:** autenticación, autorización, reglas de negocio y persistencia.
- **Base de datos:** almacenamiento de usuarios, productos, pedidos y registros comerciales.

## 4. Estructura del proyecto

```text
pasteleria1000saboresEA3-frontend/
|
├── public/
│   ├── img/
│   └── icons.svg
|
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   │   └── admin/
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── router.jsx
|
├── test/
│   ├── components/
│   ├── helpers/
│   ├── mocks/
│   └── unit/
|
├── scripts/
│   ├── build-tests.mjs
│   ├── informe-cobertura.mjs
│   └── verificar-cobertura-minima.mjs
|
├── docs/
│   └── INFORME_COBERTURA_EA3_GENERADO.md
|
├── Dockerfile
├── nginx.conf
├── karma.conf.cjs
├── vite.config.js
├── package.json
└── README.md
```

## 5. Instalación y ejecución

### Requisitos

- Node.js y npm compatibles con la versión de Vite del proyecto.
- Git.
- Navegador web moderno.
- Backend Spring Boot disponible para las funcionalidades conectadas.

### Clonar repositorio

```bash
git clone https://github.com/rimsfar73/pasteleria1000sabores-ea3-frontend.git
cd pasteleria1000sabores-ea3-frontend
```

### Instalar dependencias

```bash
npm ci
```

### Configurar entorno

Crear el archivo `.env.development` utilizando como referencia `.env.development.example`.

Configurar la URL de la API:

```env
