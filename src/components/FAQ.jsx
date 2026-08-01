"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is USDX SMART?",
    answer:
      "USDX SMART is a platform that provides structured investment plans and this guide helps you follow the complete compounding roadmap step by step.",
  },
  {
    question: "Which investment plan should I choose?",
    answer:
      "Choose the plan that best matches your investment amount. You can select between the $500, $1000, and $5000 guides.",
  },
  {
    question: "How does the 60-month guide work?",
    answer:
      "Each month contains specific instructions explaining what actions to take, when to create new IDs, and how to continue the compounding process.",
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Yes. Every guide is available separately, allowing you to access the plan that matches your investment.",
  },
  {
    question: "Do I get lifetime access?",
    answer:
      "Yes. Once you have access to the guide, you can revisit it anytime to review your monthly roadmap.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-28 bg-[#0B0B0B]">
      <div className="max-w-4xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            Frequently Asked
            <span className="text-yellow-400"> Questions</span>
          </h2>

          <p className="text-gray-400 mt-5">
            Find answers to the most common questions.
          </p>
        </div>

        <div className="space-y-5">

          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-[#151515] overflow-hidden"
            >

              <button
                onClick={() =>
                  setOpen(open === index ? null : index)
                }
                className="w-full flex justify-between items-center p-6 text-left"
              >
                <span className="text-lg font-semibold">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    open === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open === index && (
                <div className="px-6 pb-6 text-gray-400 leading-7">
                  {faq.answer}
                </div>
              )}

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}