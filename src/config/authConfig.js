// Auth configuration values for local app behavior.
// Add or remove allowed domains for UNC accounts here.
export const allowedEmailDomains = ['unc.edu', 'ad.unc.edu']

// Admin accounts for early access.
// Later the admin role should be resolved from the members collection.
export const adminEmails = ['gracewu@unc.edu', 'grace0618w@gmail.com', 'akpsi.chapelhill@gmail.com']

export function isAllowedEmail(email) {
  if (!email) return false
  const normalizedEmail = email.trim().toLowerCase()
  if (adminEmails.includes(normalizedEmail)) {
    return true
  }
  const domain = normalizedEmail.split('@')[1] || ''
  return allowedEmailDomains.includes(domain)
}
