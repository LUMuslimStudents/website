import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, MapPin } from "lucide-react";

const Events = () => {
  const events = [
    {
      id: 1,
      title: "Welcome Party 2024",
      date: "March 15, 2024",
      location: "Student Union Building",
      price: "150 SEK",
      description: "Join us for the biggest welcome party of the year!",
    },
    {
      id: 2,
      title: "Career Workshop",
      date: "March 20, 2024",
      location: "Main Campus Hall",
      price: "Free for members",
      description: "Learn from industry professionals about career opportunities.",
    },
    {
      id: 3,
      title: "Career Workshop",
      date: "March 20, 2024",
      location: "Main Campus Hall",
      price: "Free for members",
      description: "Learn from industry professionals about career opportunities.",
    },
    // Add more events as needed
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-4xl font-bold mb-8 animate-in">Upcoming Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover-card">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{event.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="font-medium">{event.price}</span>
                <Button>Register Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
