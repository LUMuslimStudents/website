import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Calendar, LifeBuoy } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const Membership = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    studyProgram: '',
    schoolEmail: '',
    phoneNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate Lund University email
      if (!formData.schoolEmail.endsWith('@student.lu.se')) {
        throw new Error('Please use your @student.lu.se email address');
      }

      const { error } = await supabase
        .from('members')
        .insert([
          {
            full_name: formData.fullName,
            study_program: formData.studyProgram,
            school_email: formData.schoolEmail,
            phone_number: formData.phoneNumber,
            membership_status: 'pending'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "We'll review your application and get back to you soon.",
      });
      
      // Clear form and close dialog
      setFormData({
        fullName: '',
        studyProgram: '',
        schoolEmail: '',
        phoneNumber: ''
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const plans = [
    {
      id: 1,
      name: "Student Membership",
      price: "100 SEK",
      period: "per semester",
      features: [
        "Access to all LUMS events",
        "Community WhatsApp group",
        "Weekly newsletters",
        "Event discounts",
      ],
    },
  ];

  const benefits = [
    {
      title: "Community Connection",
      description: "Join a vibrant community of Muslim students",
      icon: Users
    },
    {
      title: "Exclusive Events",
      description: "Get priority access to all LUMS events",
      icon: Calendar
    },
    {
      title: "Support Network",
      description: "Access to mentorship and support services",
      icon: LifeBuoy
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 py-16 mb-12">
          <div className="container relative z-10">
            <h1 className="text-5xl font-bold text-center mb-4 animate-in slide-in-from-bottom duration-700">
              Join Our Community
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
              Be part of Lund University's vibrant Muslim community. Connect, learn, and grow together.
            </p>
          </div>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        </div>
        <div className="text-center mb-12 animate-in">
          <h1 className="text-4xl font-bold mb-4">Join LUMS</h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Become part of our vibrant Muslim student community in Lund and enjoy exclusive benefits.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
              <benefit.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
        <div className="max-w-[500px] mx-auto relative z-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{plans[0].name}</CardTitle>
              <div className="flex items-baseline mt-4">
                <span className="text-3xl font-bold">{plans[0].price}</span>
                <span className="ml-2 text-muted-foreground">{plans[0].period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plans[0].features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pb-4">
              <Button 
                variant="default"
                className="w-full bg-[#004aac] hover:bg-[#004aac]/90 text-white font-medium py-2"
                onClick={() => setIsOpen(true)}
              >
                Become a Member
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Membership Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName">Full Name</label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="studyProgram">Study Program</label>
                <Input
                  id="studyProgram"
                  name="studyProgram"
                  value={formData.studyProgram}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="schoolEmail">School Email</label>
                <Input
                  id="schoolEmail"
                  name="schoolEmail"
                  type="email"
                  value={formData.schoolEmail}
                  onChange={handleInputChange}
                  required
                  pattern=".*@student\.lu\.se$"
                  title="Please use your @student.lu.se email"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phoneNumber">Phone Number</label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <FAQ />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Membership;
