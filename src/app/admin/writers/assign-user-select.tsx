"use client";

import { assignWriterToUser } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignableUser {
  id: string;
  name: string | null;
  email: string;
}

export function AssignUserSelect({
  writerId,
  currentUserId,
  users,
}: {
  writerId: number;
  currentUserId: string | null;
  users: AssignableUser[];
}) {
  return (
    <Select
      value={currentUserId ?? "unassigned"}
      onValueChange={(value) =>
        assignWriterToUser(writerId, value === "unassigned" ? null : value)
      }
    >
      <SelectTrigger className="h-7 w-40 text-xs">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name ?? user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
