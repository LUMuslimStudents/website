import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AdminEventsTab } from '@/components/admin/AdminEventsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminUser } from '@/components/admin/types';

const AdminDashboard = () => {
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
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch users');
        if (error.message?.includes('Access denied')) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="users">Members</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-0">
                <AdminUsersTab users={users} loading={loadingUsers} />
              </TabsContent>

              <TabsContent value="events" className="mt-0">
                <AdminEventsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
