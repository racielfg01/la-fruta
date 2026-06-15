import PocketBase from 'pocketbase'

let pb: PocketBase | null = null

export async function getAllRecords<T = Record<string, any>>(
  pb: PocketBase,
  collectionName: string,
  options: { sort?: string; filter?: string; expand?: string; batch?: number } = {}
): Promise<T[]> {
  const batchSize = options.batch || 500
  const result: T[] = []
  let page = 1

  while (true) {
    const records = await pb.collection(collectionName).getList<T>(page, batchSize, {
      sort: options.sort,
      filter: options.filter,
      expand: options.expand,
    })
    result.push(...records.items)
    if (records.items.length < batchSize) break
    page++
  }

  return result
}

export function getPB(): PocketBase {
  if (!pb) {
    pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
        'https://everything-hay-mercatoma.pockethost.io'
    )
    pb.autoCancellation(false)
  }
  return pb
}

export async function getAdminPB(): Promise<PocketBase> {
  const client = getPB()
  if (!client.authStore.isValid) {
    const email = process.env.POCKETBASE_ADMIN_EMAIL
    const password = process.env.POCKETBASE_ADMIN_PASSWORD
    if (!email || !password) {
      throw new Error('Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD env vars')
    }
    await client.admins.authWithPassword(email, password)
  }
  return client
}

export function getEphemeralPB(): PocketBase {
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
      'https://everything-hay-mercatoma.pockethost.io'
  )
  client.autoCancellation(false)
  return client
}

export function getTokenPB(token: string): PocketBase {
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
      'https://everything-hay-mercatoma.pockethost.io'
  )
  client.authStore.save(token)
  client.autoCancellation(false)
  return client
}
