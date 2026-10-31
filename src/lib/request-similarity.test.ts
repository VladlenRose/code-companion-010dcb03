// @ts-expect-error Bun provides runtime test types.
import { describe, expect, test } from "bun:test";
import { emptyParams, type TradeRequest } from "./bargain";
import { canBargain, requestSimilarity } from "./request-similarity";

const req = (id: string, title: string, product_id: string | null, kind: "buy" | "sell"): TradeRequest =>
  ({ id, owner_id: id, kind, title, params: emptyParams(), product_id, created_at: "" });

describe("request similarity rules", () => {
  test("goods and services never bargain", () => {
    const s = requestSimilarity(req("a", "Уборка офиса", "p1", "buy"), req("b", "Уборка офиса", "p2", "sell"), 0.95, { p1: "product", p2: "service" });
    expect(s).toBe(0);
    expect(canBargain(s)).toBe(false);
  });
  test("exactly 50% does not bargain and is shown as 0", () => {
    expect(requestSimilarity(req("a", "x", "p1", "buy"), req("b", "y", "p2", "sell"), 0.5, { p1: "service", p2: "service" })).toBe(0);
  });
  test("over 50% within same kind bargains", () => {
    const s = requestSimilarity(req("a", "x", "p1", "buy"), req("b", "y", "p2", "sell"), 0.7, { p1: "service", p2: "service" });
    expect(s).toBe(0.7);
    expect(canBargain(s)).toBe(true);
  });
  test("unrelated names give 0", () => {
    expect(requestSimilarity(req("a", "Кирпич красный", null, "buy"), req("b", "Ноутбук игровой", null, "sell"))).toBe(0);
  });
});
