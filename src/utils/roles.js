export const ROLE_HOME = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/admin",
};

export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/^"+|"+$/g, "");
}

export function homeForRole(role) {
  return ROLE_HOME[normalizeRole(role)] || null;
}
