"use client";

import { Check, X, Zap, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useUserLocation, formatPrice } from "../hooks/useUserLocation";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";
import { translatePricingText } from "@/lib/pricing-translations";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const location = useUserLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showCredits, setShowCredits] = useState(false);

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      if (!session) {
        router.push("/signup");
      } else {
        router.push("/dashboard");
      }
    } else if (planId === "enterprise") {
      router.push("/contact?subject=Enterprise%20Plan");
    } else {
      if (!session) {
        router.push("/login?redirect=/checkout?plan=" + planId);
      } else {
        router.push(`/checkout?plan=${planId}`);
      }
    }
  };

  const handleCreditPurchase = (packageId: string) => {
    if (!session) {
      router.push("/login?redirect=/checkout?credit=" + packageId);
    } else {
      router.push(`/checkout?credit=${packageId}`);
    }
  };

  const getPrice = (plan: typeof PRICING_PLANS[0]) => {
    const price = location.currency === "BRL" ? plan.priceBRL : plan.priceUSD;
    if (billingPeriod === "yearly" && !plan.isEnterprise && plan.id !== "free") {
      return price * 10; // 2 months free on yearly
    }
    return price;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            {language === "pt-BR" ? "Escolha seu Plano" : "Choose Your Plan"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {language === "pt-BR" 
              ? "Transcrição com IA de última geração. Pague apenas pelo que usar."
              : "AI-powered transcription at its finest. Pay only for what you use."}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-lg transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white dark:bg-gray-700 shadow-md"
                  : ""
              }`}
            >
              {language === "pt-BR" ? "Mensal" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-lg transition-all ${
                billingPeriod === "yearly"
                  ? "bg-white dark:bg-gray-700 shadow-md"
                  : ""
              }`}
            >
              <span>{language === "pt-BR" ? "Anual" : "Yearly"}</span>
              <span className="ml-2 text-green-500 text-sm font-semibold">
                {language === "pt-BR" ? "2 meses grátis" : "2 months free"}
              </span>
            </button>
          </div>
        </div>

        {/* Main Plans */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                  {language === "pt-BR" ? "Mais Popular" : "Most Popular"}
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{translatePricingText(plan.name, language)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {translatePricingText(plan.description, language)}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {plan.isEnterprise ? (
                    <div className="text-3xl font-bold">
                      {language === "pt-BR" ? "Personalizado" : "Custom"}
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {formatPrice(
                          getPrice(plan),
                          location.currency,
                          location.locale
                        )}
                      </span>
                      {plan.id !== "free" && (
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          /{billingPeriod === "yearly" 
                            ? (language === "pt-BR" ? "ano" : "year")
                            : (language === "pt-BR" ? "mês" : "month")}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Technology Badge */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {plan.processingSpeed}x {language === "pt-BR" ? "mais rápido" : "faster"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {translatePricingText(plan.technology, language)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {translatePricingText(plan.accuracy, language)}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.slice(0, 8).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? "" : "text-gray-500 dark:text-gray-600"
                        }
                      >
                        {translatePricingText(feature.text, language)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                      : plan.isEnterprise
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
                      : plan.id === "free"
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {plan.isEnterprise ? (
                    <span className="flex items-center justify-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {translatePricingText(plan.buttonText, language)}
                    </span>
                  ) : (
                    translatePricingText(plan.buttonText, language)
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credits Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              {language === "pt-BR" ? "Precisa de Mais Créditos?" : "Need More Credits?"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {language === "pt-BR"
                ? "Compre créditos avulsos sem assinatura. Válidos por 1 ano."
                : "Buy credits without subscription. Valid for 1 year."}
            </p>
            <button
              onClick={() => setShowCredits(!showCredits)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <CreditCard className="w-5 h-5" />
              {showCredits 
                ? (language === "pt-BR" ? "Ocultar Créditos" : "Hide Credits")
                : (language === "pt-BR" ? "Ver Pacotes de Créditos" : "View Credit Packages")}
            </button>
          </div>

          {showCredits && (
            <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">
                      {pkg.minutes} {language === "pt-BR" ? "minutos" : "minutes"}
                    </h3>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {formatPrice(
                        location.currency === "BRL" ? pkg.priceBRL : pkg.priceUSD,
                        location.currency,
                        location.locale
                      )}
                    </div>
                    {pkg.savings && (
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full mb-4">
                        {pkg.savings}
                      </span>
                    )}
                    <button
                      onClick={() => handleCreditPurchase(pkg.id)}
                      className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                    >
                      {language === "pt-BR" ? "Comprar" : "Buy Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Speed Comparison */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            {language === "pt-BR" ? "Comparação de Velocidade Real" : "Real Speed Comparison"}
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">Free</div>
              <div className="text-lg mt-2">30 min de vídeo</div>
              <div className="text-2xl font-bold text-blue-500">≈ 15 min</div>
              <div className="text-sm text-gray-600">para processar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">Pro</div>
              <div className="text-lg mt-2">30 min de vídeo</div>
              <div className="text-2xl font-bold text-green-500">≈ 7.5 min</div>
              <div className="text-sm text-gray-600">para processar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">Premium</div>
              <div className="text-lg mt-2">30 min de vídeo</div>
              <div className="text-2xl font-bold text-purple-500">≈ 3 min</div>
              <div className="text-sm text-gray-600">para processar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Enterprise
              </div>
              <div className="text-lg mt-2">30 min de vídeo</div>
              <div className="text-2xl font-bold text-pink-500">≈ 1.5 min</div>
              <div className="text-sm text-gray-600">para processar</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "pt-BR" 
              ? "Ainda tem dúvidas?" 
              : "Still have questions?"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {language === "pt-BR"
              ? "Nossa equipe está pronta para ajudar"
              : "Our team is ready to help"}
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {language === "pt-BR" ? "Falar com Suporte" : "Contact Support"}
          </Link>
        </div>
      </div>
    </div>
  );
}