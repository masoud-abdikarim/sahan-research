export function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isSuperAdmin(role: string): boolean {
  return role === "SUPERADMIN";
}

export function canCreateSuperadmin(role: string): boolean {
  // FOR NOW ONLY: Allow ADMINS to create SUPERADMIN accounts temporarily.
  // To lock down later, change this to: return role === "SUPERADMIN";
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function canManageAdmins(role: string): boolean {
  // Only SUPERADMIN has full owner control over other admin accounts.
  return role === "SUPERADMIN";
}
