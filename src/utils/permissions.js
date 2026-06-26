export const ROLE_MEMBER = 'member'
export const ROLE_ADMIN = 'admin'
export const ROLE_SUPER_ADMIN = 'super-admin'
export const ROLE_SUB_ADMIN = 'sub-admin'

const SUPER_ADMIN_ALIASES = new Set([
  ROLE_SUPER_ADMIN,
  'superadmin',
  'super_admin',
  'super admin',
  'vp-standards',
  'vp_standards',
  'vp standards',
  'vp of standards',
  'standards',
])

const SUB_ADMIN_ALIASES = new Set([
  ROLE_SUB_ADMIN,
  'subadmin',
  'sub_admin',
  'sub admin',
  'standards chair',
])

export function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === ROLE_MEMBER) return ROLE_MEMBER
  if (normalized === ROLE_ADMIN) return ROLE_ADMIN
  if (SUPER_ADMIN_ALIASES.has(normalized)) return ROLE_SUPER_ADMIN
  if (SUB_ADMIN_ALIASES.has(normalized)) return ROLE_SUB_ADMIN
  return ''
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role)
  if (normalizedRole === ROLE_SUPER_ADMIN) return 'Super Admin / VP Standards'
  if (normalizedRole === ROLE_SUB_ADMIN) return 'Sub-Admin / Standards Chair'
  if (normalizedRole === ROLE_ADMIN) return 'Admin'
  return 'Member'
}

export function isApprovedUser(user) {
  return user?.accessStatus === 'approved'
}

export function isMemberRole(user) {
  return isApprovedUser(user) && [ROLE_MEMBER, ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_SUB_ADMIN].includes(normalizeRole(user?.role))
}

export function isAdminRole(user) {
  return isApprovedUser(user) && [ROLE_ADMIN, ROLE_SUPER_ADMIN].includes(normalizeRole(user?.role))
}

export function isSuperAdminRole(user) {
  return isApprovedUser(user) && normalizeRole(user?.role) === ROLE_SUPER_ADMIN
}

export function canViewFullLeaderboard(user) {
  return isAdminRole(user)
}

export function canEditLeaderboardVisibility(user) {
  return isSuperAdminRole(user)
}

export function canViewApprovedMembers(user) {
  return isAdminRole(user)
}

export function canManageMembers(user) {
  return isSuperAdminRole(user)
}

export function canManageEvents(user) {
  return isAdminRole(user)
}

export function canAccessStandards(user) {
  const role = normalizeRole(user?.role)
  return isApprovedUser(user) && [ROLE_SUPER_ADMIN, ROLE_SUB_ADMIN].includes(role)
}

export function canReviewExcusals(user) {
  return isSuperAdminRole(user)
}

export function canViewAnalytics(user) {
  const role = normalizeRole(user?.role)
  return isApprovedUser(user) && [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_SUB_ADMIN].includes(role)
}
