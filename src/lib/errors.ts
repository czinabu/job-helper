/**
 * An error whose message is safe and helpful to show directly to a
 * non-technical user.
 */
export class FriendlyError extends Error {}

export function friendlyMessage(error: unknown): string {
  return error instanceof FriendlyError ? error.message : "Something unexpected went wrong.";
}
