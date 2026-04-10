import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Mission = () => {
  const missionVision = [
    {
      title: "Our Mission",
      description: "To create a supportive and inclusive environment for Muslim students at Lund University, fostering spiritual growth, academic excellence, and community engagement.",
      icon: "🎯"
    },
    {
      title: "Our Vision",
      description: "To be a leading Muslim student organization that empowers members to thrive in their academic journey while maintaining their Islamic identity and contributing positively to society.",
      icon: "👁️"
    },
    {
      title: "Our Values",
      description: "Unity in diversity, academic excellence, spiritual development, community service, and mutual respect.",
      icon: "⭐"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="text-4xl font-bold text-center text-[#004aac] mb-16">
            Mission & Vision
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {missionVision.map((item, index) => (
              <div 
                key={item.title}
                className="bg-muted p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 150}ms`,
                  opacity: 0,
                  animation: 'animate-in 0.5s ease-out forwards'
                }}
              >
                <div className="text-4xl mb-4 text-center">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-[#004aac] text-center">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-center">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mission; 