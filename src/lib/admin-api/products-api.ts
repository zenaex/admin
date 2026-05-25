import { ALL_PRODUCTS } from "@/components/product-mgt/product-fixtures";
import type { ProductRow } from "@/components/product-mgt/product-mgt-types";

export type ProductListResult = {
  items: ProductRow[];
  total: number;
};

/**
 * UI shell: returns product fixtures. Wire to `GET /admin/providers` and related
 * product commission routes when ready.
 */
export async function getProductMgtList(): Promise<ProductListResult> {
  return { items: ALL_PRODUCTS, total: ALL_PRODUCTS.length };
}
