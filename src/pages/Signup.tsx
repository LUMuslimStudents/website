
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { TermsConditionsDialog } from '@/components/membership/TermsConditionsDialog';

const formSchema = z.object({
    first_name: z.string()
        .min(2, 'First name must be at least 2 characters')
        .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/, 'First name can only contain latin letters and spaces'),

    last_name: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/, 'Last name can only contain latin letters and spaces'),

    email: z.string().regex(/^[a-zA-Z0-9.-]{5,}@student.lu.se$/, 'Invalid email format. Must be exclusively a Lund University student email.'),

    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
        .regex(/(?=.*\d)/, 'Password must contain at least one number'),

    gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Please select a gender' }) }),

    study_program: z.string()
        .min(2, 'Study program is required')
        .regex(/^[a-zA-Z\s&()-]+$/, 'Study program can only contain letters, numbers, spaces, and basic symbols'),

    phone_number: z.string()
        .min(5, 'Phone number is required')
        .regex(/^[\d\s+\-()]+$/, 'Phone number can only contain digits, spaces, +, -, and parentheses'),
});

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [conditionsDialog, setConditionsDialog] = useState(false);
    const [refundPolicy, setrefundPolicy] = useState(false);
    const [GDPRTerm, setGDPRTerm] = useState(false);
    const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof formSchema> | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: 'onBlur'
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setPendingFormValues(values);
        setrefundPolicy(false);
        setGDPRTerm(false);
        setConditionsDialog(true);
    };

    const handleConditionsAccept = async () => {
        if (!pendingFormValues) return;

        setLoading(true);
        try {
            await apiRequest('/auth/signup', 'POST', pendingFormValues);
            toast.success('Account created! Please check your email and click the confirmation link to verify your account.');
            navigate('/login', { state: { email: pendingFormValues.email, signupSuccess: true } });
        } catch (error: any) {
            toast.error(error.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Terms & Conditions Dialog */}
            <TermsConditionsDialog
                open={conditionsDialog}
                onOpenChange={setConditionsDialog}
                refundPolicy={refundPolicy}
                onRefundPolicyChange={setrefundPolicy}
                GDPRTerm={GDPRTerm}
                onGDPRTermChange={setGDPRTerm}
                onAccept={handleConditionsAccept}
                loading={loading}
            />

            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Become a member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Fulan" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Al-Fulani" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="ab1234cd-s@student.lu.se" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="study_program"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Study Program</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Computer Science" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+46 71 234 5678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Sign Up'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground">
                            Already a member?{' '}
                            <Link to="/login" className="text-primary hover:underline">
                                Login
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Signup;
