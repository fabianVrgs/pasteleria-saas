import type { MemberRole } from "@/lib/database.types";

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Dueño",
  admin: "Administrador",
  vendedor: "Vendedor",
  produccion: "Producción",
};

/** Roles que el dueño puede asignar a su equipo. */
export const ASSIGNABLE_ROLES: MemberRole[] = ["vendedor", "produccion", "admin"];

/** El dueño tiene todos los permisos; los demás, solo los de sus roles. */
export function hasRole(myRoles: MemberRole[], ...allowed: MemberRole[]) {
  return myRoles.includes("owner") || allowed.some((r) => myRoles.includes(r));
}

export function rolesText(roles: MemberRole[]) {
  return roles.map((r) => ROLE_LABELS[r]).join(" · ");
}
