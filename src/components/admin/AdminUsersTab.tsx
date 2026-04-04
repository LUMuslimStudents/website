import { AdminUser } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

type AdminUsersTabProps = {
  users: AdminUser[];
  loading: boolean;
};

export const AdminUsersTab = ({ users, loading }: AdminUsersTabProps) => {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {Object.keys(users[0]).map((key) => (
              <TableHead key={key} className="capitalize">
                {key.replace(/_/g, ' ')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user.id}>
              {Object.values(user).map((value: any, index) => (
                <TableCell key={index}>
                  {typeof value === 'object' && value !== null ? formatDateOnly(value) : String(value)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
