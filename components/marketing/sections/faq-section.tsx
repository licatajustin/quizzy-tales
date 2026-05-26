import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/components/marketing/content"

export function FaqSection() {
  return (
    <section
      id="faq"
      className="border-t border-border/60 bg-muted/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl tracking-tight md:text-4xl">
            Questions authors ask first
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
