import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

import { AdminUsersTab } from "./AdminUsersTab";
import { AdminUser } from "./types";

export const AdminUsersRoute = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const data = await apiRequest('/admin/users');
        if (isMounted) {
          setUsers(data);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch users';
        toast.error(message);
        if (message.includes('Access denied')) {
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return <AdminUsersTab users={users} loading={loadingUsers} />;
};
