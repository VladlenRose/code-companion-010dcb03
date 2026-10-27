export function passwordResetRedirect(origin: string) {
  return new URL("/reset-password", origin).href;
}

export function validateResetPassword(password: string, confirmation: string) {
  if (password.length < 8) return "Пароль должен содержать минимум 8 символов";
  if (password !== confirmation) return "Пароли не совпадают";
  return null;
}