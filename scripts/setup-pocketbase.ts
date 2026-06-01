import PocketBase from 'pocketbase'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://everything-hay-mercatoma.pockethost.io'
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL!
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD!

async function createCollection(pb: PocketBase, name: string, schema: any[], options?: any) {
  try {
    const existing = await pb.collections.getOne(name).catch(() => null)
    if (existing) {
      console.log(`Collection "${name}" already exists, skipping`)
      return
    }
  } catch {}

  try {
    await pb.collections.create({
      name,
      type: 'base',
      schema,
      ...options,
    })
    console.log(`Created collection "${name}"`)
  } catch (e: any) {
    console.error(`Failed to create "${name}":`, e.message)
  }
}

async function setup() {
  console.log(`Connecting to ${PB_URL}...`)
  const pb = new PocketBase(PB_URL)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS)
  console.log('Authenticated as admin')

  // Roles (simple collection, no special auth handling needed)
  await createCollection(pb, 'roles', [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'description', type: 'text' },
  ])

  // Categories
  await createCollection(pb, 'categories', [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text', required: true },
    { name: 'image', type: 'text' },
  ])

  // Products
  await createCollection(pb, 'products', [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'price', type: 'number', required: true },
    { name: 'unit', type: 'text' },
    { name: 'image', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'origin', type: 'text' },
    { name: 'stock', type: 'number' },
    { name: 'in_stock', type: 'bool' },
    { name: 'is_visible', type: 'bool' },
  ])

  // Delivery Zones
  await createCollection(pb, 'delivery_zones', [
    { name: 'name', type: 'text', required: true },
    { name: 'min_distance', type: 'number', required: true },
    { name: 'max_distance', type: 'number', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'estimated_time', type: 'text' },
    { name: 'active', type: 'bool' },
  ])

  // Orders
  await createCollection(pb, 'orders', [
    { name: 'user_id', type: 'text' },
    { name: 'user_name', type: 'text' },
    { name: 'user_email', type: 'text' },
    { name: 'subtotal', type: 'number' },
    { name: 'delivery_fee', type: 'number' },
    { name: 'total', type: 'number' },
    { name: 'status', type: 'text' },
    { name: 'payment_method', type: 'text' },
    { name: 'payment_status', type: 'text' },
    { name: 'delivery_address', type: 'text' },
    { name: 'delivery_notes', type: 'text' },
  ])

  // Order Items
  await createCollection(pb, 'order_items', [
    { name: 'order_id', type: 'text' },
    { name: 'product_id', type: 'text' },
    { name: 'product_name', type: 'text' },
    { name: 'quantity', type: 'number' },
    { name: 'price', type: 'number' },
  ])

  // Currencies
  await createCollection(pb, 'currencies', [
    { name: 'code', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'symbol', type: 'text' },
    { name: 'exchange_rate', type: 'number' },
    { name: 'is_default', type: 'bool' },
    { name: 'is_active', type: 'bool' },
  ])

  console.log('Setup complete!')
  process.exit(0)
}

setup().catch((e) => {
  console.error('Setup failed:', e)
  process.exit(1)
})
