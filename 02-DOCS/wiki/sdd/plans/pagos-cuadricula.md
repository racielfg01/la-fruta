---
type: plan
title: Plan — Cuadrícula de opciones de pago
description: Implementación de la cuadrícula de pago derivada de monedas, bancos y cuentas activas.
tags: [sdd, plan, checkout, pagos, bancos, zelle, usdt]
timestamp: 2026-11-05T13:00:00Z
topic: sdd
slug: pagos-cuadricula
status: approved
---

# Plan — Cuadrícula de opciones de pago

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir los selectores de moneda y método por una cuadrícula de opciones de pago (efectivo y bancos) construida desde monedas, bancos y cuentas activas.

**Architecture:** Una función pura arma las opciones y decide disponibilidad; el checkout solo pinta y selecciona. La moneda la define la opción. El servidor valida la cuenta de transferencia antes de crear el pedido para que un límite o una cuenta desactivada no se salten desde el cliente.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind, Radix RadioGroup, PocketBase, Vitest.

**Spec:** [../specs/pagos-cuadricula.md](../specs/pagos-cuadricula.md)

## Global Constraints

- Interfaz en español; los motivos también.
- Sin colecciones ni campos nuevos en PocketBase.
- La moneda del pedido la define la opción elegida; se sigue escribiendo en el store global de moneda.
- Cuadrícula: 4 columnas en escritorio (`sm:grid-cols-4`), 2 en móvil.
- El efectivo solo existe para CUP y USD; los bancos en moneda inactiva no se muestran.
- Tiles sin cuentas usables: visibles y deshabilitados con el motivo.
- El fallback de «ambos switches apagados» se mantiene: se muestran todos.
- Pedido por banco: `payment_method = transfer`, con banco, cuenta y comprobante.
- Puertas: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
- Detector: `/home/rack/.config/opencode/skills/impeccable/scripts/impeccable detect --json app/checkout/page.tsx` debe devolver `[]`.
- Se trabaja directo en `main` (política del repo); sin worktree.
- La verificación en navegador del checkout autenticado depende de credenciales de cliente; si no hay, se verifica por tipos, tests, build y DOM del código.

## Review Focus

- Banco con `currency` vacía y sin cuentas: no debe romper ni crear un tile sin moneda.
- Banco con moneda inactiva: no debe aparecer.
- Límite alcanzado entre la carga y el envío: el servidor debe rechazarlo, no aceptar el pedido.
- Ambos switches apagados: deben verse todos los tiles, no una cuadrícula vacía.
- Varias cuentas en un banco: solo las de la moneda del banco; la primera preseleccionada y la elegida se guarda en el pedido.
- Preselección inicial: no debe robar la elección del usuario ni entrar en bucle.

---

## 0. Restricciones del código actual

- `app/checkout/page.tsx` ya tiene `selectedPaymentMethod`, `transferBank`, `transferAccountId`, `selectedCurrency`, `selectedTransferAccount`, `fieldErrors` y el bloque de comprobante que se conserva.
- `getPublicTransferData` en `app/actions/public.ts` ya filtra cuentas activas y bancos activos, pero solo devuelve `{ id, name }` por banco y no expone el id del banco en la cuenta.
- `lib/payment-methods.ts` ya tiene `resolveVisiblePaymentMethodIds`, `clampSelectedPaymentMethod`, `isCashSupported` y `usableAccountsForCurrency`.
- `app/actions/orders.ts` crea el pedido dentro de `withOrderLock`; la validación de zona y stock ya está antes de crear. No valida la cuenta de transferencia.
- El pedido ya guarda `bank_account_id`, `bank_name`, `account_number`, `receipt`, `reference` y `transfer_amount`.
- Los switches `showPaymentCash` y `showPaymentTransfer` viven en `settings` y se editan en `general-tab.tsx`.
- No hay tests de componentes; los tests son de funciones puras con Vitest.
- PocketBase real: bancos `Zelle` y `USDT` (USD, activos) con una cuenta cada uno; `USDT` sin `account_type`.

## 1. Estructura de archivos

- **Crear** `lib/payment-options.ts`: arma los tiles desde monedas, bancos y cuentas. Sin React ni PocketBase.
- **Crear** `lib/payment-options.test.ts`: pruebas de orden, subtítulos, moneda, disponibilidad y switches.
- **Modificar** `lib/payment-methods.ts`: agregar `validateTransferAccount` y el mensaje único de cuenta no disponible.
- **Modificar** `lib/payment-methods.test.ts`: pruebas de la validación.
- **Modificar** `app/actions/public.ts`: exponer logo, moneda y `bankId` en `getPublicTransferData`.
- **Modificar** `app/checkout/page.tsx`: cuadrícula, selección, panel de banco, validación de envío.
- **Modificar** `app/actions/orders.ts`: validar la cuenta de transferencia antes de crear.
- **Modificar** `app/admin/configuracion/tabs/general-tab.tsx`: copy del switch de pagos digitales.
- **Modificar** `app/admin/configuracion/tabs/bancos-tab.tsx`: placeholder de Tipo con ejemplo `BEP-20`.

## 2. Contratos

```ts
// lib/payment-options.ts
export interface OptionCurrency { id: string; code: string; symbol: string }
export interface OptionBank { id: string; name: string; logo?: string; currency?: string }
export interface OptionAccount {
  id: string;
  bankId: string;
  currency: string;
  accountType?: string;
  transferLimit: number;
  transferCount: number;
}
export interface PaymentOption {
  id: string;              // "cash:USD" | "bank:<bankId>"
  kind: "cash" | "bank";
  currencyCode: string;
  label: string;           // "USD" | "Zelle"
  subtitle: string;        // "Efectivo" | "BEP-20" | "USD"
  logo?: string;
  bankId?: string;
  accountIds: string[];    // vacío en efectivo
  available: boolean;
  reason?: string;
}

export function buildPaymentOptions(input: {
  currencies: OptionCurrency[];
  banks: OptionBank[];
  accounts: OptionAccount[];
  showCash: boolean;
  showBanks: boolean;
}): PaymentOption[];
```

```ts
// lib/payment-methods.ts
export const TRANSFER_ACCOUNT_UNAVAILABLE =
  "La cuenta de pago ya no está disponible. Intenta con otra.";

export function validateTransferAccount(input: {
  account: {
    active?: boolean;
    currency?: string;
    transfer_limit?: number;
    transfer_count?: number;
  } | null;
  bank: { active?: boolean } | null;
  currencyCode: string;
}): string | null;
```

Reglas de `buildPaymentOptions`:

- Usa `resolveVisiblePaymentMethodIds({ showCash, showTransfer: showBanks })` para el fallback de ambos apagados.
- Efectivo: solo monedas activas con `isCashSupported`; orden USD, CUP y después el resto por código. `label = code`, `subtitle = "Efectivo"`, `available = true`.
- Bancos: ordenados por `name` con `localeCompare("es")`. `currencyCode = bank.currency?.trim() || primera cuenta del banco?.currency || ""`.
- Si `currencyCode` está vacío o no existe en `currencies`, el banco no genera tile.
- Cuentas usables: del banco, misma moneda y sin límite alcanzado (`limit > 0 && count >= limit` se excluye).
- `subtitle = accountType de la primera cuenta usable || currencyCode`.
- `available = usable.length > 0`; si no, `reason = "No hay cuentas activas en {currencyCode}."`.

## 3. Tareas

### Task 1: Opciones de pago puras

**Files:**
- Create: `lib/payment-options.ts`
- Test: `lib/payment-options.test.ts`

**Interfaces:**
- Consumes: `resolveVisiblePaymentMethodIds`, `isCashSupported` de `lib/payment-methods.ts`.
- Produces: `buildPaymentOptions`, `PaymentOption`, `OptionCurrency`, `OptionBank`, `OptionAccount` para Tasks 4.

- [x] **Step 1: Escribir los tests que fallan**

Casos, con datos `USD`/`CUP`/`EUR`, bancos `Zelle` (`b1`, USD) y `USDT` (`b2`, USD):

1. Con ambos switches, devuelve `["cash:USD", "cash:CUP", "bank:b2", "bank:b1"]` (bancos por nombre: USDT antes que Zelle).
2. `subtitle`: USDT con cuenta de tipo `BEP-20` da `BEP-20`; Zelle sin tipo da `USD`.
3. Banco sin cuentas: `available: false` y `reason: "No hay cuentas activas en USD."`.
4. Cuentas de otra moneda y con `transferLimit: 3, transferCount: 3` no entran en `accountIds`.
5. Banco con `currency: ""` y una cuenta USD: `currencyCode: "USD"`.
6. Banco con `currency: "EUR"` y sin EUR activo: no genera tile.
7. `showCash: false` quita el efectivo; `showBanks: false` quita los bancos; ambos en `false` devuelve todos.
8. Banco sin moneda y sin cuentas: no genera tile.
9. Con EUR activo no hay tile de efectivo EUR.

- [x] **Step 2: Correr y ver el fallo**

Run: `npx vitest run lib/payment-options.test.ts`
Expected: FAIL por módulo `./payment-options` inexistente.

- [x] **Step 3: Implementar `buildPaymentOptions` en `lib/payment-options.ts`**

Seguir las reglas de la sección 2. Reutilizar `isCashSupported` y `resolveVisiblePaymentMethodIds`; no duplicar la lista de monedas de efectivo.

- [x] **Step 4: Correr y ver el verde**

Run: `npx vitest run lib/payment-options.test.ts`
Expected: PASS (9 tests).

- [x] **Step 5: Commit**

```bash
git add lib/payment-options.ts lib/payment-options.test.ts
git commit -m "feat(checkout): opciones de pago derivadas de monedas y bancos"
```

### Task 2: Validación pura de la cuenta de transferencia

**Files:**
- Modify: `lib/payment-methods.ts`
- Test: `lib/payment-methods.test.ts`

**Interfaces:**
- Produces: `TRANSFER_ACCOUNT_UNAVAILABLE` y `validateTransferAccount` para Task 5.

- [x] **Step 1: Agregar los tests que fallan**

```ts
describe("validateTransferAccount", () => {
  const account = (over = {}) => ({
    active: true, currency: "USD", transfer_limit: 0, transfer_count: 0, ...over,
  });
  const bank = { active: true };
  const valid = { account: account(), bank, currencyCode: "USD" };

  it("acepta una cuenta activa, del banco activo, de la moneda y con cupo", () => {
    expect(validateTransferAccount(valid)).toBeNull();
  });
  it("rechaza cuenta inexistente o inactiva", () => {
    expect(validateTransferAccount({ ...valid, account: null })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
    expect(validateTransferAccount({ ...valid, account: account({ active: false }) })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });
  it("rechaza banco inexistente o inactivo", () => {
    expect(validateTransferAccount({ ...valid, bank: null })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
    expect(validateTransferAccount({ ...valid, bank: { active: false } })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });
  it("rechaza otra moneda", () => {
    expect(validateTransferAccount({ ...valid, currencyCode: "CUP" })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });
  it("rechaza el límite alcanzado", () => {
    expect(validateTransferAccount({ ...valid, account: account({ transfer_limit: 2, transfer_count: 2 }) })).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });
  it("acepta límite 0 (sin tope)", () => {
    expect(validateTransferAccount({ ...valid, account: account({ transfer_limit: 0, transfer_count: 99 }) })).toBeNull();
  });
});
```

- [x] **Step 2: Correr y ver el fallo**

Run: `npx vitest run lib/payment-methods.test.ts`
Expected: FAIL por `validateTransferAccount` no exportada.

- [x] **Step 3: Implementar la función**

En `lib/payment-methods.ts`, exportar el mensaje y la función con las reglas: cuenta nula/inactiva, banco nulo/inactivo, `(account.currency || "CUP") !== currencyCode`, y límite `> 0` con `count >= limit`. Devolver `null` si todo pasa.

- [x] **Step 4: Correr y ver el verde**

Run: `npx vitest run lib/payment-methods.test.ts`
Expected: PASS (16 tests: 10 actuales + 6 nuevos).

- [x] **Step 5: Commit**

```bash
git add lib/payment-methods.ts lib/payment-methods.test.ts
git commit -m "feat(pagos): validar cuenta de transferencia"
```

### Task 3: Datos públicos de bancos y cuentas

**Files:**
- Modify: `app/actions/public.ts:31-60`

**Interfaces:**
- Produces: `getPublicTransferData()` con `banks: { id, name, logo, currency }[]` y `accounts: { id, bankId, bank, accountNumber, accountType, owner, ci, currency, transferLimit, transferCount }[]`.

- [x] **Step 1: Extender el mapeo**

En `getPublicTransferData`: mapear `banks` con `{ id, name, logo: b.logo || "", currency: b.currency || "" }`; agregar `bankId: a.bank` a cada cuenta. Mantener el filtro actual (cuenta activa y banco activo) y el orden.

- [x] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [x] **Step 3: Commit**

```bash
git add app/actions/public.ts
git commit -m "feat(pagos): exponer logo y moneda del banco en datos públicos"
```

### Task 4: Cuadrícula en el checkout

**Files:**
- Modify: `app/checkout/page.tsx`

**Interfaces:**
- Consumes: `buildPaymentOptions`, `PaymentOption` (Task 1); `getPublicTransferData` con `bankId` (Task 3).
- Produces: estado de selección `selectedTileId`, `applyOption`, `handleOptionChange` y el pedido con la cuenta elegida.

- [x] **Step 1: Tipos e imports**

Agregar `bankId: string` a `TransferAccount`. Importar `buildPaymentOptions` y `PaymentOption`. Quitar `clampSelectedPaymentMethod` y los helpers que queden sin uso (`isCashSupported`, `usableAccountsForCurrency`, `resolveVisiblePaymentMethodIds` si ya no se usan en la página). Borrar `PaymentMethodConfig`, `paymentMethodsConfig`, `visibleMethodIds` y `visiblePaymentMethods`.

- [x] **Step 2: Estado y derivados**

- Reemplazar `transferBank` por `selectedBankId` (`useState("")`).
- Borrar `handleCurrencyChange`, `handleBankChange`, `accountsForBank`, `transferBankNames`, `availableTransferAccounts`, `availableMethodIds` y `availableMethodKey`.
- Calcular `paymentOptions = useMemo(() => buildPaymentOptions({ currencies, banks: transferData.banks, accounts: transferData.accounts, showCash: showPaymentCash, showBanks: showPaymentTransfer }), [currencies, transferData, showPaymentCash, showPaymentTransfer])`.
- `selectedTileId`: `cash:{code}` si el método es efectivo y hay moneda; `bank:{selectedBankId}` si es transferencia; `""` si no.
- `selectedOption = paymentOptions.find(o => o.id === selectedTileId)`.
- `selectedBankAccounts = selectedOption?.accountIds.map(id => transferData.accounts.find(a => a.id === id)).filter(Boolean) ?? []`.

- [x] **Step 3: Selección y preselección**

`applyOption(option)`: buscar la moneda activa por `option.currencyCode`; si no existe, salir. Escribir `setSelectedCurrency` y `useCurrencyStore.getState().setCurrency(currency.id)`. Si es efectivo: método `cash`, banco y cuenta vacíos. Si es banco: método `transfer`, `selectedBankId = option.bankId`, `transferAccountId = option.accountIds[0] ?? ""`. Limpiar el error `bank`.

`handleOptionChange(id)`: buscar la opción y llamar `applyOption` solo si `available`.

Preselección con `useEffect` sobre una clave estable `paymentOptions.map(o => \`${o.id}:${o.available ? 1 : 0}:${o.accountIds.join(",")}\`).join("|")`, `selectedTileId` y `isLoadingCurrencies`:
1. Si la opción actual existe y está disponible, no hacer nada.
2. Elegir efectivo de la moneda global del store; si no, la primera opción disponible.
3. Si no hay ninguna, `setSelectedPaymentMethod("")`.
4. Guardar contra bucles: no depender de `applyOption` ni de arrays nuevos.

`switchToUsd`: elegir la primera opción disponible con `currencyCode === "USD"` (las opciones ya vienen con efectivo primero).

- [x] **Step 4: Cuadrícula**

Sustituir el bloque de «Moneda de pago» y el `RadioGroup` de métodos por uno solo:

- `RadioGroup value={selectedTileId} onValueChange={handleOptionChange}` con `className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"`.
- Cada tile es un `label htmlFor={option.id}` con `RadioGroupItem id={option.id} value={option.id} disabled={!option.available} className="sr-only"`, logo (`<img src={option.logo} className="h-6 w-6 object-contain" />`) o icono (`Banknote` para efectivo, `Building2` para banco), `label` y `subtitle`.
- Estilo seleccionado igual que hoy (`border-primary bg-primary/5 ring-1 ring-primary/30`); deshabilitado `bg-muted/20`, texto muted y `option.reason` en ámbar con `AlertCircle`.
- Foco visible en el label con `focus-within:ring-2`: el radio va oculto.
- Debajo, la tasa (`rateHint`) y el `SavingHint` con `onAction={switchToUsd}` como hoy.
- Mantener sin cambios el bloque «Precio en otras monedas» (informativo).

- [x] **Step 5: Paneles de pago**

- Efectivo: conservar el bloque actual del total redondeado y la línea de redondeo.
- Banco: mostrar el nombre del banco; si `selectedBankAccounts.length > 1`, un `Select` de cuenta con `transferAccountId`; si hay una, mostrar sus datos directamente (número con copiar, tipo, titular, CI). Mantener monto a transferir, comprobante y referencia. Eliminar el selector de banco.
- Si no hay opción elegida, no renderizar panel; la confirmación queda bloqueada por validación.

- [x] **Step 6: Validación y envío**

- Reemplazar el chequeo de `availableMethodIds` por: si `selectedCurrency` existe y no hay `selectedOption?.available`, `errors.payment = \`No hay un método de pago disponible en ${selectedCurrency.code}\``.
- Mantener las validaciones de `transferAccountId` y `receiptUrl` cuando el método sea `transfer`.
- En el `orderData`, `bankName` sigue saliendo de `selectedTransferAccount?.bank`; `bankAccountId` de `transferAccountId`; `currencyCode` de `selectedCurrency.code`.

- [x] **Step 7: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npm run build`, y el detector de impeccable sobre `app/checkout/page.tsx`.
Expected: tsc 0, tests verdes, build correcto, detector `[]`.

- [x] **Step 8: Commit**

```bash
git add app/checkout/page.tsx
git commit -m "feat(checkout): cuadrícula de monedas y bancos como opciones de pago"
```

### Task 5: Validación de la cuenta en el servidor

**Files:**
- Modify: `app/actions/orders.ts:130-160`
- Consumes: `validateTransferAccount` (Task 2)

- [x] **Step 1: Insertar la validación antes de crear el pedido**

Dentro de `withOrderLock`, después de validar la zona y antes del stock:

```ts
if (orderData.paymentMethod === "transfer") {
  const account = orderData.bankAccountId
    ? await pb.collection("bank_accounts").getOne(orderData.bankAccountId).catch(() => null)
    : null;
  const bank = account?.bank
    ? await pb.collection("banks").getOne(account.bank).catch(() => null)
    : null;
  const error = validateTransferAccount({
    account,
    bank,
    currencyCode: orderData.currencyCode,
  });
  if (error) return { success: false, error };
}
```

- [x] **Step 2: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
Expected: todo en verde.

- [x] **Step 3: Commit**

```bash
git add app/actions/orders.ts
git commit -m "fix(pagos): validar cuenta de transferencia al crear el pedido"
```

### Task 6: Copy de configuración

**Files:**
- Modify: `app/admin/configuracion/tabs/general-tab.tsx:310-320`
- Modify: `app/admin/configuracion/tabs/bancos-tab.tsx:353`

- [x] **Step 1: Renombrar el switch**

«Transferencia bancaria» → «Transferencias y pagos digitales»; descripción «Zelle, USDT y cuentas bancarias; sube comprobante». El switch sigue siendo `showPaymentTransfer`.

- [x] **Step 2: Mejorar el placeholder de Tipo**

En el diálogo de cuenta, placeholder `Ej: BEP-20 / Cuenta Corriente`.

- [x] **Step 3: Verificar y commitear**

Run: `npx tsc --noEmit`
Expected: exit 0.

```bash
git add app/admin/configuracion/tabs/general-tab.tsx app/admin/configuracion/tabs/bancos-tab.tsx
git commit -m "chore(config): copy de pagos digitales y tipo de cuenta"
```

### Task 7: Cierre SDD y verificación final

**Files:**
- Modify: `02-DOCS/wiki/sdd/specs/pagos-cuadricula.md` (status `approved`)
- Modify: `02-DOCS/wiki/sdd/decisions.md`

- [x] **Step 1: Registrar la decisión**

Entrada `## 2026-11-05 — pagos-cuadricula` con: moneda definida por el tile, sin selector; datos desde Bancos y cuentas; validación de cuenta en servidor; 4 columnas.

- [x] **Step 2: Marcar la spec como aprobada**

Cambiar `status: draft` a `status: approved` en el frontmatter.

- [x] **Step 3: Verificación completa**

Run: `npx tsc --noEmit && npx vitest run && npm run build`.
Expected: tsc 0, 20+ archivos de test en verde, build correcto.

Run: `/home/rack/.config/opencode/skills/impeccable/scripts/impeccable detect --json app/checkout/page.tsx`.
Expected: `[]`.

- [x] **Step 4: Commit**

```bash
git add 02-DOCS/wiki/sdd
git commit -m "docs(sdd): aprobar spec de cuadrícula de pagos"
```

## 4. Fuera de alcance

- Orden manual de tiles, pago dividido, QR o pasarela automática.
- Persistir el método elegido entre visitas.
- Tests de componentes React (el repo no los tiene).
- Cambios en la página de confirmación, el detalle de orden o los avisos.
