// Auth configuration values for local app behavior.
// Add or remove allowed domains for UNC accounts here.
export const allowedEmailDomains = ['unc.edu', 'ad.unc.edu']

// Admin accounts for early access.
// Later the admin role should be resolved from the members collection.
export const adminEmails = ['gracewu@unc.edu']

export function isAllowedEmail(email) {
  if (!email) return false
  const normalizedEmail = email.trim().toLowerCase()
  const domain = normalizedEmail.split('@')[1] || ''
  return allowedEmailDomains.includes(domain)
}
