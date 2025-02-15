import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQ = () => (
  <div className="max-w-3xl mx-auto py-16">
    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>How do I join LUMS?</AccordionTrigger>
        <AccordionContent>
          Simply fill out the membership form and complete the payment. You'll receive a confirmation email with further details.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>What are the membership benefits?</AccordionTrigger>
        <AccordionContent>
          Members get access to all LUMS events, join our WhatsApp community, receive weekly newsletters, and enjoy event discounts.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>How long is the membership valid?</AccordionTrigger>
        <AccordionContent>
          Membership is valid for one semester. You can renew your membership at the start of each semester.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Can non-students join LUMS?</AccordionTrigger>
        <AccordionContent>
          LUMS membership is currently only open to Lund University students with a valid @student.lu.se email address.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
); 