import PocketBase from 'pocketbase'

let pb: PocketBase | null = null
let adminToken: { email: string; password: string } | null = null

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
  if (
    !client.authStore.isValid ||
    !client.authStore.isAdmin
  ) {
    await client.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    )
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
