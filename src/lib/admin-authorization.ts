/** Fail closed on missing roles and failed permission lookups. */
export function assertAdminRole(role: unknown, error: unknown) {
  if (error || role !== "admin") throw new Error("Удалять торги может только администратор.");
}