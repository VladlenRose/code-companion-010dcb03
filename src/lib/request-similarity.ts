import { titleSimilarity, type TradeRequest } from "./bargain";

/** Bargaining requires strictly more than 50% similarity. */
export const canBargain = (similarity: number) => similarity > 0.5;

/** product_id -> "product" | "service" */
export type ProductKinds = Record<string, string | null | undefined>;

const kindOf = (r: TradeRequest, kinds?: ProductKinds) => (r.product_id ? kinds?.[r.product_id] ?? undefined : undefined);

/**
 * 0..1. Goods never bargain with services (0). Anything at or below 50% is reported as 0:
 * names that are neither equal nor contextually synonymous give no partial score.
 */
export function requestSimilarity(a: TradeRequest, b: TradeRequest, semantic?: number, kinds?: ProductKinds) {
  const ka = kindOf(a, kinds) ?? "product";
  const kb = kindOf(b, kinds) ?? "product";
  if (ka !== kb) return 0;
  if (a.product_id && a.product_id === b.product_id) return 1;
  const raw = semantic !== undefined && Number.isFinite(semantic) ? semantic : titleSimilarity(a, b);
  return raw > 0.5 ? raw : 0;
}
