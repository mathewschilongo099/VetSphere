// Click-to-open questions. Uses the browser's own <details> element, so the
// answer opens in place (no new page, no loading) and the text is always in
// the page for Google to read.

export interface FaqEntry {
  question: string;
  answerHtml: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group border border-gray-200 rounded-xl bg-white overflow-hidden transition-colors hover:border-green-200 open:border-green-300 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-sm sm:text-base font-semibold text-gray-900">{faq.question}</span>
              <svg
                className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div
              className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}
