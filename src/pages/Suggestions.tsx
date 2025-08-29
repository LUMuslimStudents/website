import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Suggestions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    suggestion: "",
    category: "event"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert suggestion into Supabase
      const { error } = await supabase
        .from('suggestions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            suggestion: formData.suggestion,
            category: formData.category,
          }
        ]);

      if (error) throw error;
      
      toast({
        title: "Thank you for your suggestion!",
        description: "We'll review it and get back to you soon.",
      });

      // Clear form after successful submission
      setFormData({
        name: "",
        email: "",
        suggestion: "",
        category: "event"
      });
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page">
      <Navbar />
      <main className="flex-1">
        <div className="container max-w-2xl py-12">
          <h1 className="text-4xl font-bold text-center text-[#004aac] mb-8">
            Suggestion Box
          </h1>
          <p className="text-muted-foreground text-center mb-12">
            We value your input! Share your ideas for events, activities, or any improvements you'd like to see at LUMS.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-muted p-8 rounded-lg">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                required
              >
                <option value="event">Event Suggestion</option>
                <option value="activity">Activity Suggestion</option>
                <option value="improvement">General Improvement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="suggestion" className="text-sm font-medium">
                Your Suggestion
              </label>
              <Textarea
                id="suggestion"
                value={formData.suggestion}
                onChange={(e) => setFormData(prev => ({ ...prev, suggestion: e.target.value }))}
                required
                className="min-h-[150px] bg-background"
                placeholder="Share your ideas with us..."
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#004aac] hover:bg-[#004aac]/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Suggestion'
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suggestions; 