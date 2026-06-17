export const PLEDGE_CLASSES = ['Alpha', 'Beta', 'Gamma', 'Delta']

export const FAMILIES = ['Fireball', 'Ohana', 'Big', 'MIA', 'Baggy', 'ECC']

export function getGroupClassName(value) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown'
}
