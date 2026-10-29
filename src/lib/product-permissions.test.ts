// @ts-expect-error Bun provides test types at runtime.
import { expect, test } from "bun:test";
import { canDeleteProduct } from "./product-permissions";
test("администратор удаляет товар или услугу без владельца", () => {
  expect(canDeleteProduct("admin", null, true)).toBe(true);
});
test("владелец удаляет свою карточку", () => {
  expect(canDeleteProduct("owner", "owner", false)).toBe(true);
});
test("чужая карточка недоступна для удаления обычному участнику", () => {
  expect(canDeleteProduct("other", "owner", false)).toBe(false);
});
test("без входа удаление недоступно", () => {
  expect(canDeleteProduct(undefined, null, true)).toBe(false);
});