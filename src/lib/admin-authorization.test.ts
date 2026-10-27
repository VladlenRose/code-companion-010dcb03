// @ts-expect-error Bun provides test types at runtime.
import { expect, test } from "bun:test";
import { assertAdminRole } from "./admin-authorization";

test("администратор может удалять торги", () => {
  expect(() => assertAdminRole("admin", null)).not.toThrow();
});
test("обычный пользователь не может удалять торги", () => {
  expect(() => assertAdminRole("user", null)).toThrow();
});
test("ошибка проверки роли не разрешает удаление", () => {
  expect(() => assertAdminRole("admin", new Error("unavailable"))).toThrow();
});