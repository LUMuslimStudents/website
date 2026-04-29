import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Ramadan at Lund University",
      date: "2024-03-10",
      excerpt: "A guide to fasting during your studies and the resources available for Muslim students.",
      author: "LUMS Team",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Finding Halal Food in Lund",
      date: "2024-03-05",
      excerpt: "Discover the best places to find halal food options around campus and in the city.",
      author: "LUMS Team",
      readTime: "4 min read",
    },
    {
      id: 3,
      title: "Prayer Rooms on Campus",
      date: "2024-02-28",
      excerpt: "A comprehensive guide to prayer facilities available across Lund University campuses.",
      author: "LUMS Team",
      readTime: "3 min read",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 container py-8">
        <h1 className="text-4xl font-bold mb-8 animate-in">LUMS Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover-card">
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(post.date).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{post.author}</span>
                <span className="text-muted-foreground">{post.readTime}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
