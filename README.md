# Cotillones Ricky - Sistema de Inventario y Ventas

Aplicacion web para gestionar una tienda de cotillones: productos, clientes, personal, ventas, proveedores y moldes.

## Stack

- Frontend: Angular 19 + ng-zorro-antd
- Backend mock: Node.js + Express + Socket.IO
- Reportes: Excel (xlsx) y PDF (jspdf)
- Utilidades: QR, mapas (OpenLayers), sincronizacion en tiempo real

## Modulos principales

- Login de personal y cliente
- Inventario de productos con estado y clasificacion ABC
- Clientes y personal con CRUD
- Ventas con impacto en stock
- Proveedores de producto
- Moldes para impresiones/plantillas
- Ubicaciones de almacen (estantes)

## Mejoras aplicadas en esta version

- Se completo el backend mock con endpoints usados por el frontend:
  - `/clientes`, `/personal`, `/ventas`, `/proveedores-producto`, `/moldes`, `/ubicaciones`
  - endpoints auxiliares: `/clientes/nombres`, `/personal/nombres`, `/tipos-usuario`, `/estados-proveedor`
  - exportaciones: `/exportar-clientes`, `/exportar-personal-entrega`, `/exportar-productos`
- Se agrego Socket.IO en backend para sincronizacion en tiempo real con `inventory:event`.
- Se corrigio routing: ruta `/mapa` ya existe en configuracion de Angular.
- Se agrego proteccion de rutas con `authGuard`.
- Se agrego `authInterceptor` para enviar `Authorization: Bearer <token>`.
- Se movio la URL base de API a `environment` (`src/environments`).
- Se mejoro logout para limpiar datos de sesion relevantes.

## Ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar backend mock:

```bash
npm run server
```

3. Levantar frontend Angular:

```bash
npm start
```

4. Abrir:

- Frontend: http://localhost:4200
- API mock: http://localhost:3000/health

## Credenciales de prueba

- Personal admin:
  - usuario: `admin`
  - contrasena: `admin`
- Cliente demo:
  - usuario: `cliente`
  - contrasena: `cliente`

## Recomendaciones para pasar a produccion

1. Reemplazar backend mock por API real con base de datos (PostgreSQL/MySQL).
2. Hashear contrasenas con bcrypt y usar JWT con expiracion + refresh token.
3. Agregar control de roles por modulo (admin, vendedor, almacen).
4. Implementar pruebas unitarias y E2E de flujos criticos (login, venta, stock).
5. Configurar CI/CD (build + tests + lint) y despliegue con Docker.

## Estructura base

- `src/app`: componentes y servicios Angular
- `server.js`: API mock y eventos en tiempo real
- `src/environments`: configuracion por entorno
