import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Membership = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    studyProgram: '',
    schoolEmail: '',
    phoneNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage
    const members = JSON.parse(localStorage.getItem('members') || '[]');
    members.push({
      ...formData,
      id: Date.now(),
      joinDate: new Date().toISOString(),
    });
    localStorage.setItem('members', JSON.stringify(members));
    
    // Close dialog
    setIsOpen(false);
    
    // Clear form
    setFormData({
      fullName: '',
      studyProgram: '',
      schoolEmail: '',
      phoneNumber: ''
    });

    // Show success message (you can add a toast here)
    alert('Registration successful!');
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="text-center mb-12 animate-in">
          <h1 className="text-4xl font-bold mb-4">Join LUMS</h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Become part of our vibrant Muslim student community in Lund and enjoy exclusive benefits.
          </p>
        </div>
        <div className="max-w-[500px] mx-auto">
          <Card className="hover-card">
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
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => {
                  setIsOpen(true);
                }}
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
                />
              </div>
              <Button type="submit" className="w-full">
                Proceed to Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Membership;
