import type { Role } from "@prisma/client";

export function canAccessAdmin(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "TEAM";
}

export function canManageContent(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}

export function canEditContent(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "TEAM";
}

export function canManageUsers(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}
