// @ts-expect-error Bun provides test types at runtime.
import { expect, test } from "bun:test";
import { passwordResetRedirect, validateResetPassword } from "./password-reset";

test("ссылка восстановления ведёт на установку пароля, а не на главную", () => {
  expect(passwordResetRedirect("https://market.example")).toBe("https://market.example/reset-password");
});
test("не совпадающие пароли не сохраняются", () => {
  expect(validateResetPassword("abcdefgh", "abcdefgi")).toBe("Пароли не совпадают");
});