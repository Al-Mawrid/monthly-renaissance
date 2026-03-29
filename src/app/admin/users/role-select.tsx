"use client";

import { updateUserRole } from "../actions";
import type { Role } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  return (
    <Select
      defaultValue={currentRole}
      onValueChange={(value) => updateUserRole(userId, value as Role)}
    >
      <SelectTrigger className="h-7 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="TEAM">Team</SelectItem>
        <SelectItem value="MEMBER">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}
