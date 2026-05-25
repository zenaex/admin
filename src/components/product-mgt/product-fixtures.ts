import type { ProductRow } from "@/components/product-mgt/product-mgt-types";

export const PRODUCT_PROVIDERS = ["Buypower", "Presmit", "Quidax", "Baxi", "Flutterwave"];

const BASE_PRODUCTS: Omit<ProductRow, "id">[] = [
  {
    productName: "EKEDC Postpaid",
    productCategory: "Electricity",
    commissionType: "Percentage",
    commissionRate: "1.0%",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦50 FLAT",
    cap: "₦60 FLAT",
    switchProvider: "Presmit",
    status: "Active",
  },
  {
    productName: "Global 139",
    productCategory: "E-sim",
    commissionType: "Flat",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Amazon USA",
    productCategory: "Giftcard",
    commissionType: "Percentage",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Google Play UK",
    productCategory: "Giftcard",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "1.0",
    switchProvider: "Buypower",
    status: "Inactive",
  },
  {
    productName: "Bitcoin",
    productCategory: "Crypto",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Quidax",
    status: "Active",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Inactive",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
  {
    productName: "Spectranet Data",
    productCategory: "Internet",
    commissionType: "% capped @",
    commissionRate: "₦5000",
    cap: "-",
    switchProvider: "Buypower",
    status: "Active",
  },
];

export const ALL_PRODUCTS: ProductRow[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_PRODUCTS[i % BASE_PRODUCTS.length],
  id: `product-${i}`,
  productName:
    i < BASE_PRODUCTS.length
      ? BASE_PRODUCTS[i].productName
      : `${BASE_PRODUCTS[i % BASE_PRODUCTS.length].productName} (${i + 1})`,
}));

export const PRODUCT_TABS = ["All", "Utility", "Crypto", "Giftcard", "E-sim"] as const;

export const TAB_CATEGORY_MAP: Record<(typeof PRODUCT_TABS)[number], string | null> = {
  All: null,
  Utility: "Electricity",
  Crypto: "Crypto",
  Giftcard: "Giftcard",
  "E-sim": "E-sim",
};

export const COMMISSION_TYPE_FILTER = [
  "All types",
  ...Array.from(new Set(BASE_PRODUCTS.map((p) => p.commissionType))),
];

export const PRODUCT_STATUS_FILTER = ["All statuses", "Active", "Inactive"] as const;
export const PROVIDER_FILTER_OPTIONS = ["All providers", ...PRODUCT_PROVIDERS];
