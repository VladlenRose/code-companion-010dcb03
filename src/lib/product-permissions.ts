export function canDeleteProduct(userId: string | undefined, ownerId: string | null | undefined, isAdmin: boolean) {
  return !!userId && (isAdmin || ownerId === userId);
}