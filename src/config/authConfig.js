export const allowedEmailDomain = 'unc.edu'

export function isAllowedEmail(email) {
  if (!email) return false
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail.endsWith(`@${allowedEmailDomain}`)
}
