import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAdminData = vi.fn();
const mockAddProductAction = vi.fn();
const mockEditProductAction = vi.fn();
const mockRemoveProductAction = vi.fn();
const mockAddCategoryAction = vi.fn();
const mockEditCategoryAction = vi.fn();
const mockRemoveCategoryAction = vi.fn();
const mockAddDeliveryZoneAction = vi.fn();
const mockEditDeliveryZoneAction = vi.fn();
const mockRemoveDeliveryZoneAction = vi.fn();
const mockAddUserAction = vi.fn();
const mockEditUserAction = vi.fn();
const mockRemoveUserAction = vi.fn();
const mockSetOrderStatusAction = vi.fn();
const mockSetPaymentStatusAction = vi.fn();
const mockAddCurrencyAction = vi.fn();
const mockEditCurrencyAction = vi.fn();
const mockRemoveCurrencyAction = vi.fn();
const mockSetDefaultCurrencyAction = vi.fn();
const mockAddOfferAction = vi.fn();
const mockEditOfferAction = vi.fn();
const mockRemoveOfferAction = vi.fn();
const mockCreateRoleAction = vi.fn();
const mockUpdateRoleAction = vi.fn();
const mockDeleteRoleAction = vi.fn();

const mockLogout = vi.fn();
let authState = { token: "token-1" as string | null };

vi.mock("@/app/actions/admin", () => ({
  getAdminData: (...args: unknown[]) => mockGetAdminData(...args),
  addProductAction: (...args: unknown[]) => mockAddProductAction(...args),
  editProductAction: (...args: unknown[]) => mockEditProductAction(...args),
  removeProductAction: (...args: unknown[]) => mockRemoveProductAction(...args),
  addCategoryAction: (...args: unknown[]) => mockAddCategoryAction(...args),
  editCategoryAction: (...args: unknown[]) => mockEditCategoryAction(...args),
  removeCategoryAction: (...args: unknown[]) => mockRemoveCategoryAction(...args),
  addDeliveryZoneAction: (...args: unknown[]) => mockAddDeliveryZoneAction(...args),
  editDeliveryZoneAction: (...args: unknown[]) => mockEditDeliveryZoneAction(...args),
  removeDeliveryZoneAction: (...args: unknown[]) => mockRemoveDeliveryZoneAction(...args),
  addUserAction: (...args: unknown[]) => mockAddUserAction(...args),
  editUserAction: (...args: unknown[]) => mockEditUserAction(...args),
  removeUserAction: (...args: unknown[]) => mockRemoveUserAction(...args),
  setOrderStatusAction: (...args: unknown[]) => mockSetOrderStatusAction(...args),
  setPaymentStatusAction: (...args: unknown[]) => mockSetPaymentStatusAction(...args),
  addCurrencyAction: (...args: unknown[]) => mockAddCurrencyAction(...args),
  editCurrencyAction: (...args: unknown[]) => mockEditCurrencyAction(...args),
  removeCurrencyAction: (...args: unknown[]) => mockRemoveCurrencyAction(...args),
  setDefaultCurrencyAction: (...args: unknown[]) => mockSetDefaultCurrencyAction(...args),
  addOfferAction: (...args: unknown[]) => mockAddOfferAction(...args),
  editOfferAction: (...args: unknown[]) => mockEditOfferAction(...args),
  removeOfferAction: (...args: unknown[]) => mockRemoveOfferAction(...args),
}));

vi.mock("@/app/actions/admin-extras", () => ({
  createRoleAction: (...args: unknown[]) => mockCreateRoleAction(...args),
  updateRoleAction: (...args: unknown[]) => mockUpdateRoleAction(...args),
  deleteRoleAction: (...args: unknown[]) => mockDeleteRoleAction(...args),
}));

vi.mock("./auth-context", () => ({
  useAuthStore: {
    getState: () => ({
      token: authState.token,
      logout: mockLogout,
    }),
  },
}));

import { useAdminStore } from "./admin-store";

function emptyAdminData() {
  return {
    products: [] as unknown[],
    categories: [] as unknown[],
    deliveryZones: [] as unknown[],
    users: [] as unknown[],
    orders: [] as unknown[],
    currencies: [] as unknown[],
    roles: [] as unknown[],
    offers: [] as unknown[],
  };
}

function resetStore() {
  useAdminStore.setState({
    loaded: false,
    loading: false,
    products: [],
    categories: [],
    deliveryZones: [],
    users: [],
    orders: [],
    currencies: [],
    roles: [],
    offers: [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  authState = { token: "token-1" };
  resetStore();
});

describe("admin-store initialize/refresh", () => {
  test("initialize carga los datos una vez y marca loaded", async () => {
    const data = { ...emptyAdminData(), orders: [{ id: "o1" }] };
    mockGetAdminData.mockResolvedValue(data);

    await useAdminStore.getState().initialize();

    expect(mockGetAdminData).toHaveBeenCalledTimes(1);
    expect(mockGetAdminData).toHaveBeenCalledWith("token-1");
    expect(useAdminStore.getState().loaded).toBe(true);
    expect(useAdminStore.getState().loading).toBe(false);
    expect(useAdminStore.getState().orders).toEqual([{ id: "o1" }]);
  });

  test("initialize no vuelve a cargar si ya está loaded", async () => {
    mockGetAdminData.mockResolvedValue(emptyAdminData());
    await useAdminStore.getState().initialize();
    await useAdminStore.getState().initialize();

    expect(mockGetAdminData).toHaveBeenCalledTimes(1);
  });

  test("refresh vuelve a pedir datos aunque ya esté loaded", async () => {
    mockGetAdminData
      .mockResolvedValueOnce({ ...emptyAdminData(), orders: [{ id: "o1" }] })
      .mockResolvedValueOnce({ ...emptyAdminData(), orders: [{ id: "o2" }] });

    await useAdminStore.getState().initialize();
    await useAdminStore.getState().refresh();

    expect(mockGetAdminData).toHaveBeenCalledTimes(2);
    expect(useAdminStore.getState().orders).toEqual([{ id: "o2" }]);
    expect(useAdminStore.getState().loaded).toBe(true);
  });

  test("refresh no dispara otra carga si ya hay una en curso", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockGetAdminData.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as (value: unknown) => void;
        })
    );

    const first = useAdminStore.getState().initialize();
    const second = useAdminStore.getState().refresh();

    expect(mockGetAdminData).toHaveBeenCalledTimes(1);

    resolveFetch({ ...emptyAdminData(), orders: [{ id: "o1" }] });
    await Promise.all([first, second]);

    expect(useAdminStore.getState().orders).toEqual([{ id: "o1" }]);
  });
});
