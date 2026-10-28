/**
 * Calculates the destination path post-login or post-signup.
 * If returnTo is valid (internal URL that isn't login/signup), returns returnTo.
 * Otherwise returns the designated home page for the role:
 * - Driver (USER) -> "/" (Home road journey)
 * - Host (HOST) -> "/host" (Host Dashboard)
 * - Admin (ADMIN) -> "/admin" (Admin Console)
 */
export function getPostLoginPath(role, returnTo = null) {
  if (
    returnTo &&
    typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('/login') &&
    !returnTo.startsWith('/signup')
  ) {
    return returnTo
  }

  const normalizedRole = (role || '').toUpperCase()
  if (normalizedRole === 'ADMIN') return '/admin'
  if (normalizedRole === 'HOST') return '/host'
  return '/app'
}
