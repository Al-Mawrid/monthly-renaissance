import type { Role } from "@prisma/client";

export function canAccessAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "TEAM";
}

export function canManageContent(role: Role): boolean {
  return role === "ADMIN";
}

export function canEditContent(role: Role): boolean {
  return role === "ADMIN" || role === "TEAM";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: Role): boolean {
  return role === "ADMIN";
}
