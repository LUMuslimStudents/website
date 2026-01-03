
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    study_program: string;
    phone_number: string;
    created_at: string;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiRequest('/users');
                setUsers(data);
            } catch (error: any) {
                toast.error(error.message || 'Failed to fetch users');
                // Optional: Redirect if unauthorized, though apiRequest might handle it or throw
                if (error.message.includes('Access denied')) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container py-10">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Admin Dashboard - User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading users...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {users.length > 0 && Object.keys(users[0]).map((key) => (
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
                                                        {typeof value === 'object' && value !== null
                                                            ? new Date(value).toLocaleDateString() // Handle dates
                                                            : String(value)
                                                        }
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {!loading && users.length === 0 && <p className="text-center py-4">No users found.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
