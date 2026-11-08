export const ROLES = Object.freeze({
  STUDENT: "student",
  MESS_COMMITTEE: "mess_committee",
  ADMIN: "admin",
  STAFF: "staff"
});

export const ALL_ROLES = Object.values(ROLES);

// Legacy role names still present in old data until migration runs
export const LEGACY_ROLES = Object.freeze({
  WARDEN: "warden",
  MESS_ADMIN: "mess_admin"
});

// Map old -> new (used in migration + fallback reads)
export const ROLE_ALIASES = Object.freeze({
  warden: "admin",
  mess_admin: "mess_committee"
});

export function normalizeRole(role) {
  return ROLE_ALIASES[role] || role;
}