export const ROLES = Object.freeze({
  STUDENT: "student",
  MESS_ADMIN: "mess_admin",
  WARDEN: "warden",
  STAFF: "staff"
});

export const ALL_ROLES = Object.values(ROLES);

export const STAFF_MANAGED_ROLES = [ROLES.MESS_ADMIN, ROLES.WARDEN, ROLES.STAFF];