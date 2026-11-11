export interface RolePermissions {
  dashboard: boolean;
  orders: boolean;
  products: boolean;
  shipping: boolean;
  users: boolean;
  settings: boolean;
  offers: boolean;
}

export const ALL_PERMISSIONS: RolePermissions = {
  dashboard: true,
  orders: true,
  products: true,
  shipping: true,
  users: true,
  settings: true,
  offers: true,
};

export const NO_PERMISSIONS: RolePermissions = {
  dashboard: false,
  orders: false,
  products: false,
  shipping: false,
  users: false,
  settings: false,
  offers: false,
};
