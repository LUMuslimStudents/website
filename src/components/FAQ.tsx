import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Reveal } from "@/components/Reveal";

const FAQ_ITEMS = [
  {
    question: "Who can join LUMS?",
    answer:
      "Membership is only open to students currently studying at Lund University with a valid @student.lu.se email address.",
  },
  {
    question: "How long is my membership valid?",
    answer:
      "A single-term membership is valid for one semester. A two-term membership covers both semesters of the academic year at a discounted price.\
      Membership follows the term, not the calendar — if you have a single-term membership you renew by paying for the new term when it starts. There is no need to re-register.",
  },
  {
    question: "Are membership fees refundable?",
    answer:
      "No — membership fees are non-refundable. The fee directly funds the association's events and activities, so please only pay once you are sure you want to join for the term.",
  },
];

export const FAQ = () => (
  <section className="relative overflow-hidden bg-muted/40 py-16 md:py-24">
    <div
      className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      aria-hidden="true"
    />
    <div className="container relative z-10">
      <Reveal className="text-center">
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          Questions
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          Frequently asked questions
        </h2>
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <Reveal delay={120}>
        <Accordion type="single" collapsible className="mx-auto mt-12 w-full max-w-3xl">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  </section>
);