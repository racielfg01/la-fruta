# MercaToma

Tienda online de frutas y productos frescos con entrega a domicilio en Cuba.
Catálogo, carrito, checkout con envío por zonas, pago en efectivo o por
transferencia bancaria, y panel de administración completo (productos,
categorías, envíos, órdenes, usuarios, configuración).

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router, Turbopack, Server Actions) + React 19 |
| Lenguaje | TypeScript |
| Backend / datos | PocketBase (instancia remota en pockethost.io) |
| Estilos | Tailwind CSS + shadcn/ui (Radix UI) |
| Estado cliente | Zustand (con persistencia en localStorage) |
| UI / extras | react-leaflet (mapa), uploadthing (imágenes), sonner (toasts), recharts (dashboard), next-themes, SWR |

## Requisitos

- Node.js 20+ (desarrollado con Node 22)
- Una instancia PocketBase (remota en pockethost u otra) con credenciales de **admin**
- Opcional: token de UploadThing para la subida de imágenes de productos

## Configuración

Copia estas variables a `.env.local` (el esqueleto vive en
`01-TOOLS/_TEMPLATE/.env.example`; los valores reales nunca se commitean):

```bash
# Pública: se expone al navegador (URL de la instancia PocketBase)
NEXT_PUBLIC_POCKETBASE_URL=https://<tu-instancia>.pockethost.io

# Solo servidor: la usa getAdminPB() dentro de las Server Actions
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=********

# Opcional: subida de imágenes de productos
UPLOADTHING_TOKEN=********
```

Explícito: con una instancia remota no hace falta correr PocketBase localmente.

## Puesta en marcha

```bash
pnpm install        # o npm install (el repo usa lock de pnpm)
cp 01-TOOLS/_TEMPLATE/.env.example .env.local   # y rellena los valores
pnpm dev            # http://localhost:3000
```

Preparar una instancia PocketBase vacía (idempotente, se puede repetir):

```bash
node scripts/setup-pocketbase.js        # colecciones base + colección users
node scripts/setup-admin-auth.cjs       # alta del admin del .env
node scripts/setup-collections-extra.cjs   # catálogo técnico + seed (provincias, municipios, países, bancos, cuentas, settings)
node scripts/seed-municipalities.cjs    # municipios de Cuba
node scripts/setup-saved-collections.cjs  # beneficiarios + direcciones guardadas del checkout
```

`node scripts/migrate.cjs` y `node scripts/diagnose-pb.cjs` ayudan a migrar o
diagnosticar una instancia existente.

### Scripts npm

| Comando | Función |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint sobre todo el repo |

## Estructura del proyecto

```
app/                Rutas (App Router) y Server Actions
├── page.tsx        Tienda: catálogo, búsqueda, filtros, onboarding de ubicación
├── product/[id]/   Detalle de producto
├── cart/           Carrito
├── checkout/       Finalizar compra (validación inline, guardar beneficiario/direcciones)
├── order-confirmation/   Confirmación de orden
├── perfil/         Perfil del usuario (sus pedidos)
├── auth/login, auth/signup, auth-demo/
├── admin/          Panel admin: productos, categorías, envíos, ordenes, usuarios, configuracion
├── offline/        Página PWA offline
├── api/upload, api/uploadthing   Subida de archivos
└── actions/        Server Actions (auth, orders, admin, public, public-products,
                    public-currencies, saved)
components/         Componentes React (ui/ = primitivas shadcn, más header,
                    product-card, store-view, delivery-map, onboarding, cart,
                    auth-provider, login/signup forms, theme…)
lib/                Stores Zustand, cliente PocketBase, auth (JWT), permisos,
                    monedas, paginación, validaciones y helpers
scripts/            Setup y migración de PocketBase
02-DOCS/            Documentación del harness rsc (perfil, plan, decisiones)
01-TOOLS/, .opencode/, .rsc/, AGENTS.md   Harness de agentes (rsc-harness)
```

## Autenticación y roles

- Autenticación por **JWT de PocketBase** (`_pb_users_auth_`). El token se
  persiste en localStorage por Zustand (`auth-storage`) y `AuthProvider` lo
  refresca al arrancar cada sesión (`refreshUserAction`).
- Los roles viven en la colección `roles` (`admin` / `client`); `getRoleIds()`
  resuelve nombres → ids. Los permisos por módulo están en `lib/permissions.ts`.
- Las Server Actions que tocan datos sensibles operan **solo en el servidor**
  con credenciales admin (`getAdminPB()`) y validan el token del usuario
  (`decodePocketBaseToken`). Las credenciales admin nunca llegan al cliente.

## Modelo de datos (colecciones PocketBase)

| Colección | Propósito |
| --- | --- |
| `users` | Clientes y administradores (relación a `roles`) |
| `roles` | `admin` / `client` + permisos |
| `products` | Productos: precio, unidad, stock, categoría, origen, activo |
| `categories` | Categorías del catálogo |
| `delivery_zones` | Zonas de envío: rango de km, costo, tiempo estimado |
| `orders` | Órdenes: usuario, dirección, total, moneda, estado y medio de pago (con campos de transferencia) |
| `order_items` | Líneas de cada orden (producto, cantidad, precio) |
| `banks` / `bank_accounts` | Cuentas para pago por transferencia (con límite diario de transferencias) |
| `currencies` | Monedas (USD, CUP…) y tipo de cambio; una por defecto |
| `settings` | Configuración global (colores, WhatsApp, etc.) |
| `provinces` / `municipalities` / `countries` | Datos geográficos para dirección y zonas |
| `beneficiaries` | Contactos guardados por el usuario en el checkout |
| `user_addresses` | Direcciones guardadas con alias y zona |

## Flujo de compra

1. **Onboarding de ubicación** — el usuario ubica su zona en el mapa
   (react-leaflet) + municipio; se determina la zona de envío disponible.
2. **Catálogo / detalle** — búsqueda, filtros por categoría, paginación; se
   agrega al carrito (persistido en localStorage por `la-fruta-cart`).
3. **Checkout** — zona de envío y dirección (+ guardar como dirección con
   alias y zona), datos de contacto (+ guardar beneficiario), moneda de pago,
   método de pago (efectivo o transferencia con comprobante), y confirmación.
   El formulario valida inline, con scroll y foco al primer error.
4. **Confirmación** — página de resultado y seguimiento de pedidos en `/perfil`.

El checkout permite guardar y reutilizar contactos y direcciones de entrega
(colecciones `beneficiaries` y `user_addresses`), cada dirección con su alias
y zona.

## Panel de administración (`/admin`)

Dashboard, gestión de productos (con subida de imágenes vía uploadthing),
categorías, zonas de envío, órdenes (estados y pagos), usuarios, roles y
configuración global (bancos, cuentas, monedas, colores, WhatsApp).
Acceso protegido por rol y por módulo (`verifyAdminAndGetUserId` en las
Server Actions).

## Notas de operación

- Los filtros y ordenamientos de PocketBase en pockethost son sensibles:
  ej. `sort=created` puede devolver 400 en colecciones recién creadas — usa
  `sort=id` (los ids de PB son ordenables por creación).
- `getAdminPB()` re-autentica con las credenciales del `.env` por llamada;
  no logger credenciales ni las envíes nunca al cliente.