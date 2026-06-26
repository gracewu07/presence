export function getMemberDisplayName(member) {
  return member?.preferredName?.trim() || member?.name?.trim() || member?.memberName?.trim() || member?.email || 'Member'
}

export function getMemberFirstName(member) {
  return getMemberDisplayName(member).split(/\s+/)[0] || 'Member'
}
