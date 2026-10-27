export type Audience = "admin" | "client";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export interface NotificationSettings {
  newOrder: boolean;
  newUser: boolean;
  newProducts: boolean;
  lastProductsPushAt: string | null;
}

export interface StoredPushSubscription extends PushSubscriptionInput {
  id: string;
  userId: string;
  userName: string;
  audience: Audience;
  active: boolean;
}

export interface NotificationCounts {
  admins: number;
  clients: number;
  newProducts: number;
  newProductNames: string[];
}

export interface NotificationOverview {
  configured: boolean;
  setupNeeded: boolean;
  settings: NotificationSettings;
  counts: NotificationCounts;
  canAnnounce: boolean;
  cooldownSeconds: number;
}

export type NotificationOverviewResult =
  | ({ success: true } & NotificationOverview)
  | { success: false; error: string };

export interface PushConfigResult {
  configured: boolean;
  publicKey: string | null;
}

export interface SimpleActionResult {
  success: boolean;
  error?: string;
}

export interface SettingsActionResult extends SimpleActionResult {
  settings?: NotificationSettings;
}

export interface SubscribeResult extends SimpleActionResult {
  audience?: Audience;
}

export interface AnnounceActionResult extends SimpleActionResult {
  sent?: number;
  failed?: number;
  total?: number;
  names?: string[];
  cooldownSeconds?: number;
}
