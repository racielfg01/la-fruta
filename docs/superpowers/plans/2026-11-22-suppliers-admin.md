# Proveedores Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear `/admin/proveedores` con contacto de proveedores, precios derivados de la última compra, histórico de compras con notas y un botón que aplica el stock al general.

**Architecture:** Dominio puro en `lib/suppliers.ts` (tipos, validación, precios y reglas de stock); server actions en `app/actions/suppliers.ts` sobre PocketBase con `requirePermission(token, "products")`; UI cliente en `app/admin/proveedores` con lista lateral y ficha de detalle, siguiendo los patrones de `app/admin/ofertas`. Las colecciones nuevas se crean en el script idempotente existente.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, PocketBase SDK 0.27 (`pb.createBatch()`), Tailwind + componentes `components/ui`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-suppliers-admin-design.md`

## Global Constraints

- Ruta: `/admin/proveedores`; entrada en `adminNavigation` con permiso `products`.
- Colecciones PocketBase: `suppliers`, `purchases`, `purchase_items` (snake_case, reglas por defecto = solo admin).
- Campos exactos: `suppliers.{name,phone}`; `purchases.{supplier,purchased_at,notes,stock_applied_at,created_by}`; `purchase_items.{purchase,product,product_name,quantity,unit_price}`.
- Relaciones de `purchase_items` apuntan a `purchases` y `products`; `purchases.supplier` apunta a `suppliers`.
- Precio mostrado = `unit_price` de la compra más reciente de ese proveedor para ese producto; nunca campo editable.
- “Agregar stock” suma solo a `products.stock` (y `in_stock: true`), nunca a `product_locations`.
- Crear compra NO modifica stock; aplicar stock es idempotente por compra.
- Todas las acciones exigen `requirePermission(token, "products")`.
- Dinero se formatea con `Intl.NumberFormat("es-ES")`, igual que `app/admin/ordenes/page.tsx`.
- Sin colecciones: la UI muestra aviso de setup y no rompe.

## Review Focus

- Producto borrado del catálogo antes de aplicar stock → se omite, se informa y la compra queda aplicada: prueba en Task 1 (`stockDeltas` con id ausente).
- Doble clic en “Agregar stock” → no suma dos veces: prueba en Task 1 (`canApplyStock` con `stockAppliedAt` presente) y comprobación en Task 4.
- Línea con producto vacío, cantidad 0 o precio negativo → se rechaza antes de escribir: prueba en Task 1 (`validatePurchaseInput`).
- Borrar proveedor con compras o compra con stock aplicado → se bloquea: prueba en Task 1 (`canDeleteSupplier`/`canDeletePurchase`) y comprobación en Task 4.
- Colecciones PB ausentes → `setupNeeded: true`, listas vacías y aviso en pantalla: prueba en Task 1 (`isSuppliersSetupError`) y estado en Task 5.

---

### Task 1: Dominio de proveedores y compras

**Files:**
- Create: `lib/suppliers.ts`
- Test: `lib/suppliers.test.ts`

**Interfaces:**
- Consumes: `buildOrFilter` y `sanitize` de `@/lib/pocketbase` (solo las acciones, no este módulo).
- Produces:

```ts
export interface Supplier { id: string; name: string; phone: string }
export interface ProductOption { id: string; name: string; unit: string }
export interface PurchaseLineInput { product: string; quantity: number; unitPrice: number }
export interface PurchaseItem extends PurchaseLineInput { id: string; productName: string }
export interface Purchase {
  id: string; supplier: string; purchasedAt: string; notes: string
  stockAppliedAt: string | null; total: number; items: PurchaseItem[]
}
export interface SupplierPrice {
  product: string; productName: string; unit: string; unitPrice: number; purchasedAt: string
}
export interface PurchaseInput {
  supplier: string; purchasedAt: string; notes: string; items: PurchaseLineInput[]
}
export function toSupplier(rec: Record<string, any>): Supplier
export function toProductOption(rec: Record<string, any>): ProductOption
export function toPurchaseItem(rec: Record<string, any>): PurchaseItem
export function toPurchase(rec: Record<string, any>, items: PurchaseItem[]): Purchase
export function validateSupplierInput(input: { name?: string; phone?: string }): { name: string; phone: string }
export function validatePurchaseInput(input: PurchaseInput): PurchaseInput
export function purchaseTotal(lines: PurchaseLineInput[]): number
export function latestPrices(purchases: Purchase[], products: ProductOption[]): SupplierPrice[]
export function canApplyStock(purchase: Purchase): boolean
export function stockDeltas(
  purchase: Purchase, productIds: string[]
): { updates: Array<{ product: string; quantity: number }>; missing: string[] }
export function canDeleteSupplier(purchases: Purchase[]): boolean
export function canDeletePurchase(purchase: Purchase): boolean
export function isSuppliersSetupError(error: unknown): boolean
```

- [ ] **Step 1: Write the failing test**

`lib/suppliers.test.ts` debe cubrir, con `describe` por grupo:
- `toSupplier` y `toPurchase` mapean ids/fechas y total calculado.
- `validateSupplierInput` lanza `/nombre/` con nombre vacío y `/teléfono/` con teléfono vacío.
- `validatePurchaseInput` lanza con `items: []`, con `quantity: 0` y con `unitPrice: -1`.
- `purchaseTotal([{product:"p1",quantity:2,unitPrice:1200},{product:"p2",quantity:1,unitPrice:900}])` = 3300.
- `latestPrices` con dos compras del mismo producto devuelve el precio de la más reciente; con `products` que incluye `{id:"p1",name:"Tomate",unit:"por kg"}` devuelve `unit: "por kg"`.
- `canApplyStock` es `true` con `stockAppliedAt: null` y `false` con fecha.
- `stockDeltas` con `productIds: ["p1"]` e items `p1`, `p2` devuelve `updates: [{product:"p1",quantity:3}]` y `missing: ["p2"]`.
- `canDeleteSupplier([])` = true, `canDeleteSupplier([purchase])` = false; `canDeletePurchase` false si `stockAppliedAt` no es null.
- `isSuppliersSetupError({status:404})` = true; `isSuppliersSetupError(new Error("red"))` = false.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/suppliers.test.ts`
Expected: FAIL con “Failed to resolve import ./suppliers”.

- [ ] **Step 3: Implement `lib/suppliers.ts`**

Implementa todas las firmas anteriores. `latestPrices` recibe `purchases` ordenadas de más reciente a más antigua (lo garantiza la acción); usa el primer precio encontrado por producto. `stockDeltas` ignora items cuyo `product` no esté en `productIds` y los devuelve en `missing`. `isSuppliersSetupError` considera setup error `status` 404 o mensaje que contenga `collection` / `not found`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/suppliers.test.ts`
Expected: PASS (todos los casos).

- [ ] **Step 5: Commit**

```bash
git add lib/suppliers.ts lib/suppliers.test.ts
git commit -m "feat(proveedores): add domain helpers and tests"
```

---

### Task 2: Esquema PocketBase y ficha FTD

**Files:**
- Modify: `scripts/setup-collections-extra.cjs`
- Create: `02-DOCS/wiki/ftd/proveedores.md`
- Modify: `02-DOCS/wiki/index.md`

**Interfaces:**
- Consumes: helpers `createCollection`, `T.text`, `T.number`, `T.relation`, `T.autodate` del propio script.
- Produces: colecciones `suppliers`, `purchases`, `purchase_items` con los campos de Global Constraints; script ejecutable con `node scripts/setup-collections-extra.cjs`.

- [ ] **Step 1: Add the three collections to the setup script**

En `scripts/setup-collections-extra.cjs`, después del bloque `story_reactions`, obtener ids con `pb.collections.getOne(name).catch(() => null)` y crear:
- `suppliers`: `T.text("name", true)`, `T.text("phone", true)`, `T.autodate("created")`, `T.autodate("updated", true)`.
- `purchases`: relación `supplier` escrita explícitamente como `{ name: "supplier", type: "relation", required: true, collectionId: suppliersCollId, cascadeDelete: false, minSelect: 1, maxSelect: 1 }`; `T.text("notes")`, `T.text("created_by")`; fechas `purchased_at` y `stock_applied_at` como `{ name, type: "date", required: false }`; autodates.
- `purchase_items`: relaciones `purchase` y `product` con el mismo objeto explícito (requeridas, `minSelect: 1`, `maxSelect: 1`, ids de `purchases` y `products`); `T.text("product_name")`, `T.number("quantity", true)`, `T.number("unit_price", true)`, autodates.
- Omitir reglas (quedan `null` = solo administradores, igual que las colecciones administradas del script).

- [ ] **Step 2: Verify the script parses**

Run: `node --check scripts/setup-collections-extra.cjs`
Expected: sin salida de error.

- [ ] **Step 3: Write the FTD page and link it**

Crear `02-DOCS/wiki/ftd/proveedores.md` con: intención, alcance (alta de proveedores, precios derivados, compras con notas, botón de stock al general), fuera de alcance (stock por zona, edición de compras, emails), checklist y el comando de setup con `NEXT_PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`. Añadir fila en la tabla “FTD recientes” de `02-DOCS/wiki/index.md` apuntando a `ftd/proveedores.md`.

- [ ] **Step 4: Commit**

```bash
git add scripts/setup-collections-extra.cjs 02-DOCS/wiki/ftd/proveedores.md 02-DOCS/wiki/index.md
git commit -m "feat(proveedores): add PocketBase collections and FTD notes"
```

---

### Task 3: Entrada en la navegación del admin

**Files:**
- Modify: `lib/admin-navigation.ts`
- Test: `lib/admin-navigation.test.ts`

**Interfaces:**
- Consumes: `AdminNavItem`, `adminNavigation`, `adminSectionLabel` del mismo módulo.
- Produces: ruta `/admin/proveedores` visible en el menú con etiqueta “Proveedores”, icono `Warehouse` e `href` ordenado después de “Productos”.

- [ ] **Step 1: Write the failing test**

Añadir a `lib/admin-navigation.test.ts`:

```ts
it("muestra Proveedores en la ruta de proveedores", () => {
  expect(adminSectionLabel("/admin/proveedores")).toBe("Proveedores");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/admin-navigation.test.ts`
Expected: FAIL con “expected Panel de Administración to be Proveedores”.

- [ ] **Step 3: Add the nav item**

En `lib/admin-navigation.ts`, importar `Warehouse` desde `lucide-react` e insertar después de “Productos”:
`{ name: "Proveedores", href: "/admin/proveedores", icon: Warehouse, permission: "products" }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/admin-navigation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin-navigation.ts lib/admin-navigation.test.ts
git commit -m "feat(proveedores): add admin navigation entry"
```

---

### Task 4: Server actions

**Files:**
- Create: `app/actions/suppliers.ts`

**Interfaces:**
- Consumes: Task 1 (`lib/suppliers.ts` completo), `requirePermission` de `@/lib/admin-auth`, `getAdminPB`, `getTokenPB`, `getAllRecords`, `buildOrFilter`, `sanitize` de `@/lib/pocketbase`, `toPocketBaseDate` de `@/lib/push/settings`.
- Produces:

```ts
export interface SuppliersOverview {
  setupNeeded: boolean
  suppliers: Supplier[]
  products: ProductOption[]
}
export interface SupplierDetail {
  prices: SupplierPrice[]
  purchases: Purchase[]
}
export interface ApplyStockResult {
  applied: number
  missing: string[]
}
export async function getSuppliersOverviewAction(token: string): Promise<SuppliersOverview>
export async function getSupplierDetailAction(token: string, supplierId: string): Promise<SupplierDetail>
export async function createSupplierAction(token: string, input: { name: string; phone: string }): Promise<Supplier>
export async function updateSupplierAction(token: string, id: string, input: { name: string; phone: string }): Promise<void>
export async function deleteSupplierAction(token: string, id: string): Promise<void>
export async function createPurchaseAction(token: string, input: PurchaseInput): Promise<{ id: string }>
export async function deletePurchaseAction(token: string, id: string): Promise<void>
export async function applyPurchaseStockAction(token: string, purchaseId: string): Promise<ApplyStockResult>
```

- [ ] **Step 1: Implement read actions and PB access**

`"use server"`; helper privado `getDataPB(token)` intenta `getAdminPB()` y cae a `getTokenPB(token)` (patrón de `app/actions/admin-extras.ts`). Toda acción llama `await requirePermission(token, "products")` primero. `getSuppliersOverviewAction` trae `suppliers` ordenados por `name` y `products` ordenados por `name` mapeados con `toProductOption`; si `isSuppliersSetupError(e)`, devuelve `{setupNeeded:true, suppliers:[], products:[]}`. `getSupplierDetailAction` trae compras con `filter: 'supplier = "${sanitize(supplierId)}"', sort: "-purchased_at,-created"`, sus items con `buildOrFilter("purchase", ids)` y devuelve `prices: latestPrices(purchases, products)` (productos obtenidos con `getAllRecords(pb, "products")`).

- [ ] **Step 2: Implement supplier write actions**

`createSupplierAction` y `updateSupplierAction` validan con `validateSupplierInput` y escriben `name`/`phone`. `deleteSupplierAction` consulta compras del proveedor y lanza “No se puede borrar un proveedor con compras” si `canDeleteSupplier(purchases)` es false; luego borra.

- [ ] **Step 3: Implement purchase actions**

`createPurchaseAction` valida con `validatePurchaseInput`, verifica que todos los ids de producto existan en `products` (lanza “Producto no encontrado” si falta), crea `purchases` con `supplier`, `purchased_at: toPocketBaseDate(input.purchasedAt)` (lanza si queda vacío), `notes`, `created_by` del `requirePermission`, y sin `stock_applied_at` (queda vacío), y luego crea las líneas con `pb.createBatch()` sobre `purchase_items` con `product_name` tomado del catálogo. Si el batch falla, borra la compra creada y relanza. `deletePurchaseAction` obtiene la compra, exige `canDeletePurchase` y borra compra + sus items en un `pb.createBatch()`.

- [ ] **Step 4: Implement `applyPurchaseStockAction`**

Obtiene compra e items; si `!canApplyStock(purchase)` lanza “El stock de esta compra ya fue aplicado”. Calcula `stockDeltas(purchase, productIds)` con los productos existentes. Con `pb.createBatch()` registra un `update` por producto existente (`{ stock: Number(product.stock)||0 + quantity, in_stock: true }`) y un `update` de la compra con `stock_applied_at: toPocketBaseDate(new Date())`; `await batch.send()`. Devuelve `{applied: updates.length, missing}`. No toca `product_locations`.

- [ ] **Step 5: Type-check and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sin errores nuevos.

- [ ] **Step 6: Commit**

```bash
git add app/actions/suppliers.ts
git commit -m "feat(proveedores): add suppliers and purchases server actions"
```

---

### Task 5: Página, lista lateral y alta de proveedores

**Files:**
- Create: `app/admin/proveedores/page.tsx`
- Create: `components/admin/suppliers/supplier-sidebar.tsx`
- Create: `components/admin/suppliers/supplier-form.tsx`

**Interfaces:**
- Consumes: Task 3 (`adminNavigation`), Task 4 (`getSuppliersOverviewAction`, `createSupplierAction`, `updateSupplierAction`, `deleteSupplierAction`, tipos `Supplier`, `ProductOption`, `SuppliersOverview`).
- Produces: `SupplierSidebar({ suppliers, selectedId, onSelect, onCreated, onError })` y `SupplierForm({ open, supplier, onClose, onSaved })`; la página exporta `default function ProveedoresPage()` y mantiene `selectedId`, `overview` y `detail` en estado.

- [ ] **Step 1: Create the page shell with data loading**

`app/admin/proveedores/page.tsx` es `"use client"`, usa `useAuthStore((s) => s.token)`, un `load` con `useCallback` que llama `getSuppliersOverviewAction(token)` y guarda `overview`; `useEffect` inicial. Muestra `Loader2` mientras carga, un `Alert` con el aviso de setup si `overview.setupNeeded`, y un panel derecho con texto “Selecciona un proveedor” mientras no haya `selectedId`. Deja declarado `const [detail, setDetail] = useState<SupplierDetail | null>(null)` y una función `loadDetail(id: string)` que llama `getSupplierDetailAction(token, id)`.

- [ ] **Step 2: Create the sidebar**

`supplier-sidebar.tsx` usa `Card`, `Button`, `Input` y la lista de proveedores con nombre y teléfono; el seleccionado lleva `bg-emerald-50` (o clase activa equivalente del repo). Botón “+ Proveedor” abre `SupplierForm`. Cada fila tiene acciones de editar y borrar; borrar usa `AlertDialog` de `components/ui/alert-dialog` y llama `deleteSupplierAction(token, id)`. Errores se muestran con `toast.error`.

- [ ] **Step 3: Create the supplier form**

`supplier-form.tsx` usa `Dialog` de `components/ui/dialog` con campos nombre y teléfono; valida en cliente con `validateSupplierInput`; guarda con `createSupplierAction` o `updateSupplierAction` según `supplier`. Llama `onSaved()` al terminar.

- [ ] **Step 4: Verify build and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add app/admin/proveedores/page.tsx components/admin/suppliers/supplier-sidebar.tsx components/admin/suppliers/supplier-form.tsx
git commit -m "feat(proveedores): add admin page and supplier management UI"
```

---

### Task 6: Detalle, precios, compras y botón de stock

**Files:**
- Create: `components/admin/suppliers/supplier-detail.tsx`
- Create: `components/admin/suppliers/purchase-form.tsx`
- Modify: `app/admin/proveedores/page.tsx`

**Interfaces:**
- Consumes: Task 1 (`purchaseTotal`, `canApplyStock`), Task 4 (`getSupplierDetailAction`, `createPurchaseAction`, `deletePurchaseAction`, `applyPurchaseStockAction`, `SupplierDetail`, `SupplierPrice`, `Purchase`, `ApplyStockResult`), Task 5 (`ProveedoresPage` con `selectedId`/`loadDetail`).
- Produces: `SupplierDetailPanel({ supplier, detail, products, token, onChanged })` y `PurchaseForm({ open, supplierId, products, onClose, onSaved })`.

- [ ] **Step 1: Create the purchase form**

`purchase-form.tsx` usa `Dialog`, `Input`, `Select`, `Textarea`, `Button` y `Table`. Estado inicial: `purchasedAt` = hoy en `YYYY-MM-DD`, una línea vacía, `notes` = "". Permite añadir/quitar líneas; cada línea elige producto de `products` (muestra `name` y `unit`), cantidad y precio. El total usa `purchaseTotal`. Al guardar valida con `validatePurchaseInput` y llama `createPurchaseAction(token, input)`; muestra errores con `toast.error` y llama `onSaved()`.

- [ ] **Step 2: Create the detail panel**

`supplier-detail.tsx` muestra encabezado con nombre y teléfono; bloque “Precios” con tabla producto / precio (`Intl.NumberFormat("es-ES")`) / unidad a partir de `detail.prices`; bloque “Compras” con tabla fecha, número de productos, total calculado con `purchaseTotal`, notas y botón “+ Nueva compra” que abre `PurchaseForm`. Cada compra tiene “Agregar stock” solo si `canApplyStock(purchase)`; pulsarlo pide confirmación con `AlertDialog`, llama `applyPurchaseStockAction(token, purchase.id)` y avisa `missing` con `toast.warning`. Cada compra tiene borrar con `AlertDialog` que llama `deletePurchaseAction`.

- [ ] **Step 3: Wire the detail into the page**

En `app/admin/proveedores/page.tsx`, al seleccionar proveedor llamar `loadDetail(id)`; renderizar `SupplierDetailPanel` con `supplier`, `detail`, `products`, `token` y `onChanged={() => { void load(); void loadDetail(selectedId); }}`. Al crear borrar proveedor, recargar `overview` y limpiar selección si el proveedor desapareció.

- [ ] **Step 4: Verify focused checks**

Run: `pnpm vitest run lib/suppliers.test.ts lib/admin-navigation.test.ts && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS sin errores nuevos.

- [ ] **Step 5: Manual smoke**

Con PocketBase configurado y las colecciones creadas: crear proveedor, crear compra con dos productos, comprobar que el bloque Precios muestra el último precio, pulsar “Agregar stock”, comprobar que el stock global subió una sola vez y que el botón desaparece, y recargar para confirmar persistencia.

- [ ] **Step 6: Commit**

```bash
git add components/admin/suppliers/supplier-detail.tsx components/admin/suppliers/purchase-form.tsx app/admin/proveedores/page.tsx
git commit -m "feat(proveedores): show prices, purchase history and stock application"
```
