export const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      quote: "LUMS has been an incredible support system during my studies.",
      author: "Sarah Ahmed",
      role: "Computer Science Student"
    },
    {
      id: 2,
      quote: "The community here is so welcoming and supportive.",
      author: "Mohammed Ali",
      role: "Engineering Student"
    },
    {
      id: 3,
      quote: "Great events and opportunities to connect with fellow students.",
      author: "Fatima Khan",
      role: "Medical Student"
    }
  ];

  return (
    <div className="bg-muted py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Members Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <blockquote key={testimonial.id} className="p-6 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg mb-4 italic">{testimonial.quote}</p>
              <footer>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-muted-foreground">{testimonial.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}; 