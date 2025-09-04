"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out our service",
    technology: "Standard AI Model",
    accuracy: "~90% accuracy",
    features: [
      { text: "2 hours per month (120 min)", included: true },
      { text: "Standard quality transcription", included: true },
      { text: "SRT & TXT export", included: true },
      { text: "10 languages", included: true },
      { text: "Basic translation", included: true },
      { text: "Email support", included: true },
      { text: "Priority processing", included: false },
      { text: "Speaker detection", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For content creators and professionals",
    technology: "Advanced AI Model",
    accuracy: "~95% accuracy",
    features: [
      { text: "10 hours per month (600 min)", included: true },
      { text: "Premium quality transcription", included: true },
      { text: "All export formats", included: true },
      { text: "50+ languages", included: true },
      { text: "Premium AI translation", included: true },
      { text: "Priority support", included: true },
      { text: "2x faster processing", included: true },
      { text: "Speaker detection", included: true },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "per month",
    description: "For teams and heavy users",
    technology: "Enterprise AI Model",
    accuracy: "~98% accuracy",
    features: [
      { text: "30 hours per month (1800 min)", included: true },
      { text: "Ultra-premium transcription", included: true },
      { text: "All export formats + API", included: true },
      { text: "100+ languages", included: true },
      { text: "Neural AI translation", included: true },
      { text: "24/7 priority support", included: true },
      { text: "5x faster processing", included: true },
      { text: "Advanced speaker diarization", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const handlePlanClick = (planName: string) => {
    if (!session) {
      router.push("/login");
    } else if (planName === "Free") {
      router.push("/dashboard");
    } else {
      // For paid plans, go to payment checkout
      router.push(`/api/payment/checkout?plan=${planName.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("pricing.subtitle")}
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
                  {t("pricing.mostPopular")}
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
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {plan.description}
                </p>
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {plan.technology}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {plan.accuracy}
                  </p>
                </div>
                
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
                
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("pricing.faq.title")}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                {t("pricing.faq.accuracyQuestion")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("pricing.faq.accuracyAnswer")}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                {t("pricing.faq.cancelQuestion")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("pricing.faq.cancelAnswer")}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                {t("pricing.faq.formatsQuestion")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("pricing.faq.formatsAnswer")}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">
                {t("pricing.faq.securityQuestion")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("pricing.faq.securityAnswer")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">
            {t("pricing.cta.questionsTitle")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("pricing.cta.questionsSubtitle")}
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {t("pricing.cta.contactSupport")}
          </Link>
        </div>
      </div>
    </div>
  );
}