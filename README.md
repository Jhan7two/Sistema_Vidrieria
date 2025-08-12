# Sistema Vidriería

Este repositorio contiene un sistema completo para la gestión de una vidriería, dividido en dos grandes partes: backend y frontend.

## Estructura del Proyecto

- `/backend` - Lógica del servidor, base de datos y API.
- `/frontend` - Aplicación de usuario, interfaz y lógica del cliente.

---

## Backend

El backend sigue una arquitectura clásica de servidor REST y está estructurado en módulos como:

- **Modelos:** Definen la estructura de los datos y las entidades principales del sistema (productos, clientes, pedidos, etc).
- **Controladores:** Implementan la lógica de negocio y gestionan las operaciones sobre los modelos.
- **Rutas:** Exponen los endpoints de la API para interactuar con el sistema (crear, consultar, actualizar, eliminar recursos).
- **Base de datos:** El backend gestiona una base de datos relacional o NoSQL para almacenar toda la información relevante.
- **Configuraciones y middlewares:** Seguridad, manejo de sesiones, validaciones, etc.

Ejemplo típico de instalación y ejecución:

```sh
cd backend
npm install
npm run dev
```

---

## Frontend

El frontend está desarrollado usando un framework moderno (probablemente Vue.js o similar) y organiza su código en:

- **Componentes:** Elementos reutilizables de la interfaz gráfica.
- **Vistas:** Páginas principales del sistema (login, dashboard, gestión de pedidos, etc).
- **Stores o estado global:** Manejo del estado de la aplicación (por ejemplo, con Vuex o Pinia).
- **Ruteo:** Navegación entre vistas mediante un router.

Para ejecutar el frontend:

```sh
cd frontend
npm install
npm run dev
```

---

## Características principales

- Gestión de clientes, productos, pedidos y ventas.
- Panel administrativo para editar y visualizar información.
- Control de inventario y seguimiento de entregas.
- Acceso seguro con autenticación.
- Interfaz moderna y amigable.

---

## Contribuciones

¡Las contribuciones son bienvenidas! Abre un issue o pull request para sugerir mejoras o reportar bugs.

## Licencia

Este proyecto aún no especifica una licencia.

---

> Si necesitas detalles adicionales sobre la estructura interna o ejemplos de código, revisa las carpetas `/backend` y `/frontend`.
