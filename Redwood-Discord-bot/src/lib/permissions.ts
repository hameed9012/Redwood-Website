/** Pure membership check: does this list of role IDs include the high-command role? */
export function hasHighCommandRole(memberRoleIds: string[], highCommandRoleId: string): boolean {
  return memberRoleIds.includes(highCommandRoleId);
}
