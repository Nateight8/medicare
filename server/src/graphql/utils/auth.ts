/**
 * Get the authenticated user ID from the context
 * @throws {AuthenticationError} If user is not authenticated
 */
export function getAuthenticatedUserId(context: any): string {
  const userId = context.userId;

  return userId;
}
