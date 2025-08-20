"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out our service",
    features: [
      { text: "30 minutes per month", included: true },
      { text: "Basic transcription", included: true },
      { text: "SRT export", included: true },
      { text: "5 languages", included: true },
      { text: "Email support", included: true },
      { text: "API access", included: false },
      { text: "Priority processing", included: false },
      { text: "Bulk uploads", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For content creators and professionals",
    features: [
      { text: "500 minutes per month", included: true },
      { text: "Advanced AI transcription", included: true },
      { text: "All export formats", included: true },
      { text: "100+ languages", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: true },
      { text: "Priority processing", included: true },
      { text: "Bulk uploads", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    description: "For teams and organizations",
    features: [
      { text: "Unlimited minutes", included: true },
      { text: "Custom AI models", included: true },
      { text: "All export formats", included: true },
      { text: "100+ languages", included: true },
      { text: "24/7 phone support", included: true },
      { text: "API access", included: true },
      { text: "Priority processing", included: true },
      { text: "Bulk uploads", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? ""
                            : "text-gray-500 dark:text-gray-600"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/login"
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                How accurate is the transcription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI achieves 99.5% accuracy for clear audio in supported languages.
                Accuracy may vary based on audio quality and background noise.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. You'll continue to
                have access until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                What file formats do you support?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We support all major audio and video formats including MP3, WAV, MP4,
                M4A, WebM, MOV, AVI, and more.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, all files are encrypted during transfer and storage. Files are
                automatically deleted after processing to ensure your privacy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our team is here to help you get started
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}