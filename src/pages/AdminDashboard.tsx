import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(true);

  const activeTab = useMemo(() => {
    if (location.pathname.startsWith('/admin/events')) {
      return 'events';
    }
    return 'users';
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        await apiRequest('/admin/users');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to open admin dashboard';
        toast.error(message);
        if (message.includes('Access denied')) {
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setCheckingAccess(false);
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10">
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => navigate(`/admin/${value}`)} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="users">Members</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-0">
              <Outlet />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
