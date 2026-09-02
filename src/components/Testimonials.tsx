import { Quote } from "lucide-react";
import { StarMark, OrnamentDivider } from "@/components/IslamicPattern";
import { Reveal } from "@/components/Reveal";

/**
 * Real quotes from LUMS members. Paste real quotes here:
 *   { quote, author, role? }
 * While the array is empty the whole section is hidden — no fake
 * testimonials will ever show.
 */
const MEMBER_QUOTES: { quote: string; author: string; role?: string }[] = [
  {
    author: "Mohamad",
    role: "Alumnus",
    quote: "LUMS is a place where i can connect with brothers \
    from different backgrounds who share similar interests. \
    It's a platform where i can take part in social activities and \
    build meaningful relationships, something that can be hard to find elsewhere."
  },
  {
    author: "Abdul Rehman",
    role: "Exchange student",
    quote: "I have been following LUMS since the beginning, \
    and it was the main reason for choosing to do my exchange semester in Lund. \
    Here, I met brothers with whom I have strong connections to this day, and we keep in touch."
  }
];

export const Testimonials = () => {
  if (MEMBER_QUOTES.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative z-10">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            From our members
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            What members say
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBER_QUOTES.map((testimonial, index) => (
            <Reveal
              key={`${testimonial.author}-${index}`}
              delay={index * 80}
              className="h-full"
            >
              <blockquote className="relative flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-6 shadow-soft backdrop-blur-sm">
                <Quote className="h-6 w-6 text-gold/60" />
                <p className="mt-4 flex-1 text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    {testimonial.role && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    )}
                  </div>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};