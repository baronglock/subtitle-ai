"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  Smartphone,
  Check,
  Zap,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useUserLocation, formatPrice } from "../hooks/useUserLocation";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";
import { useLanguage } from "../contexts/LanguageContext";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutForm = ({ plan, creditPackage }: { plan?: string; creditPackage?: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { data: session } = useSession();
  const { language } = useLanguage();
  const location = useUserLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "mercadopago" | "pix_direct">("pix_direct"); // Default to direct PIX for simplicity

  // Determine what's being purchased
  const isCredit = !!creditPackage;
  const purchaseItem = isCredit 
    ? CREDIT_PACKAGES.find(p => p.id === creditPackage)
    : PRICING_PLANS.find(p => p.id === plan);

  const getPrice = () => {
    if (!purchaseItem) return 0;
    if (isCredit) {
      const pkg = purchaseItem as typeof CREDIT_PACKAGES[0];
      return location.currency === "BRL" ? pkg.priceBRL : pkg.priceUSD;
    } else {
      const plan = purchaseItem as typeof PRICING_PLANS[0];
      return location.currency === "BRL" ? plan.priceBRL : plan.priceUSD;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // For Direct PIX, use simplest flow
    if (paymentGateway === "pix_direct" && location.currency === "BRL") {
      setProcessing(true);
      try {
        const response = await fetch("/api/payment/pix-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: isCredit ? "credit" : "subscription",
            itemId: isCredit ? creditPackage : plan,
            currency: location.currency,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Store PIX data for display
          (window as any).pixPaymentData = {
            pixCode: data.pixCode,
            qrCode: data.qrCode,
            amount: data.amount,
            orderId: data.orderId,
            description: data.description,
          };
          setSucceeded(true);
          setProcessing(false);
        } else {
          throw new Error(data.error || "Failed to generate PIX");
        }
      } catch (error) {
        console.error("PIX error:", error);
        setError("Error generating PIX. Please try again.");
        setProcessing(false);
      }
      return;
    }

    // For MercadoPago, use different flow
    if (paymentGateway === "mercadopago" && location.currency === "BRL") {
      setProcessing(true);
      try {
        const response = await fetch("/api/payment/mercadopago/create-preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: isCredit ? "credit" : "subscription",
            itemId: isCredit ? creditPackage : plan,
            currency: location.currency,
          }),
        });

        const { initPoint } = await response.json();
        
        // Redirect to MercadoPago checkout
        window.location.href = initPoint;
        return;
      } catch (error) {
        console.error("MercadoPago error:", error);
        setError("Error processing payment. Please try again.");
        setProcessing(false);
        return;
      }
    }

    // Original Stripe flow
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Create payment session on the server
      const response = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: isCredit ? "credit" : "subscription",
          itemId: isCredit ? creditPackage : plan,
          userId: (session?.user as any)?.id,
          email: session?.user?.email,
          paymentMethod: paymentMethod,
          currency: location.currency,
        }),
      });

      const { sessionUrl, pixCode, pixQrCode } = await response.json();

      if (paymentMethod === "pix" && location.currency === "BRL") {
        // Show PIX payment instructions
        setSucceeded(true);
        // Store PIX code for display
        (window as any).pixPaymentData = { pixCode, pixQrCode };
      } else if (paymentMethod === "card") {
        // Process card payment
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          setError("Card element not found");
          setProcessing(false);
          return;
        }

        // Redirect to Stripe Checkout
        if (sessionUrl) {
          window.location.href = sessionUrl;
        } else {
          // Fallback to client-side payment
          const { clientSecret } = await response.json();
          const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: session?.user?.name || "",
                email: session?.user?.email || "",
              },
            },
          });

          if (result.error) {
            setError(result.error.message || "An error occurred");
            setProcessing(false);
          } else {
            setError(null);
            setSucceeded(true);
            setTimeout(() => {
              router.push("/dashboard?payment=success");
            }, 2000);
          }
        }
      }
    } catch (err) {
      setError("Failed to process payment");
      setProcessing(false);
    }
  };

  if (!purchaseItem) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Invalid purchase item</p>
        <Link href="/pricing" className="text-blue-500 hover:underline mt-4 inline-block">
          Return to pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link 
        href="/pricing" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {language === "pt-BR" ? "Voltar aos planos" : "Back to pricing"}
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-fit">
          <h2 className="text-2xl font-bold mb-4">
            {language === "pt-BR" ? "Resumo do Pedido" : "Order Summary"}
          </h2>
          
          {isCredit ? (
            <div className="border-b dark:border-gray-700 pb-4 mb-4">
              <h3 className="text-xl font-semibold">
                {(purchaseItem as typeof CREDIT_PACKAGES[0]).minutes} {language === "pt-BR" ? "Minutos" : "Minutes"}
              </h3>
              <div className="text-3xl font-bold mt-2">
                {formatPrice(getPrice(), location.currency, location.locale)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {language === "pt-BR" 
                  ? "Créditos válidos por 1 ano"
                  : "Credits valid for 1 year"}
              </p>
            </div>
          ) : (
            <div className="border-b dark:border-gray-700 pb-4 mb-4">
              <h3 className="text-xl font-semibold">
                {(purchaseItem as typeof PRICING_PLANS[0]).name} Plan
              </h3>
              <div className="text-3xl font-bold mt-2">
                {formatPrice(getPrice(), location.currency, location.locale)}
                <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                  /{language === "pt-BR" ? "mês" : "month"}
                </span>
              </div>
              
              {/* Speed badge */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">
                    {(purchaseItem as typeof PRICING_PLANS[0]).processingSpeed}x {
                      language === "pt-BR" ? "mais rápido" : "faster processing"
                    }
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(purchaseItem as typeof PRICING_PLANS[0]).technology}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold mb-3">
              {language === "pt-BR" ? "Incluído:" : "Included:"}
            </h4>
            {isCredit ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {(purchaseItem as typeof CREDIT_PACKAGES[0]).minutes} {
                      language === "pt-BR" ? "minutos de transcrição" : "minutes of transcription"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {language === "pt-BR" ? "Sem assinatura mensal" : "No monthly subscription"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {language === "pt-BR" ? "Use quando quiser" : "Use anytime"}
                  </span>
                </div>
              </div>
            ) : (
              (purchaseItem as typeof PRICING_PLANS[0]).features
                .filter(f => f.included)
                .slice(0, 6)
                .map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.text}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            {language === "pt-BR" ? "Informações de Pagamento" : "Payment Information"}
          </h2>

          {succeeded ? (
            <div className="text-center py-8">
              {(paymentMethod === "pix" || paymentGateway === "pix_direct") && (window as any).pixPaymentData ? (
                <div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {language === "pt-BR" ? "PIX Gerado!" : "PIX Generated!"}
                  </h3>
                  
                  {/* QR Code Display */}
                  {(window as any).pixPaymentData.qrCode && (
                    <div className="mb-6">
                      <img 
                        src={(window as any).pixPaymentData.qrCode} 
                        alt="QR Code PIX" 
                        className="mx-auto rounded-lg shadow-lg"
                        style={{ maxWidth: "300px" }}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {language === "pt-BR" 
                          ? "Escaneie com o app do seu banco"
                          : "Scan with your banking app"}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {language === "pt-BR" ? "PIX Copia e Cola:" : "PIX Copy & Paste:"}
                    </p>
                    <p className="font-mono text-xs break-all select-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">
                      {(window as any).pixPaymentData.pixCode}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>{language === "pt-BR" ? "IMPORTANTE:" : "IMPORTANT:"}</strong> {language === "pt-BR" 
                        ? "Após fazer o PIX, aguarde até 5 minutos para a confirmação automática."
                        : "After making the PIX payment, wait up to 5 minutes for automatic confirmation."}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>{language === "pt-BR" ? "Valor:" : "Amount:"}</strong> R$ {(window as any).pixPaymentData.amount?.toFixed(2)}</p>
                    <p><strong>{language === "pt-BR" ? "Produto:" : "Product:"}</strong> {(window as any).pixPaymentData.description}</p>
                    <p className="mt-2 text-xs">ID: {(window as any).pixPaymentData.orderId}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-500 text-2xl">✓</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {language === "pt-BR" ? "Pagamento Processado!" : "Payment Successful!"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === "pt-BR" 
                      ? "Redirecionando para o dashboard..."
                      : "Redirecting to dashboard..."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Payment Gateway Selection for Brazil */}
              {location.currency === "BRL" && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      {language === "pt-BR" ? "Escolha como pagar" : "Choose payment method"}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentGateway("pix_direct")}
                        className={`p-4 rounded-lg border-2 transition-all relative ${
                          paymentGateway === "pix_direct"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          {language === "pt-BR" ? "Recomendado" : "Recommended"}
                        </div>
                        <div className="flex items-center justify-center h-8 mb-2">
                          <span className="text-3xl">🏦</span>
                        </div>
                        <p className="text-sm font-semibold">PIX Direto</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {language === "pt-BR" ? "Simples e rápido" : "Simple & fast"}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentGateway("mercadopago")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === "mercadopago"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <img 
                          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large.png" 
                          alt="MercadoPago" 
                          className="h-8 mx-auto mb-2 object-contain"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {language === "pt-BR" ? "Várias opções" : "Many options"}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentGateway("stripe")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === "stripe"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-center h-8 mb-2">
                          <span className="text-2xl font-bold text-indigo-600">stripe</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {language === "pt-BR" ? "Cartão" : "Card"}
                        </p>
                      </button>
                    </div>
                    {paymentGateway === "pix_direct" && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✓ {language === "pt-BR" 
                            ? "PIX direto para nossa conta! Você paga, nós confirmamos rapidinho." 
                            : "Direct PIX to our account! You pay, we confirm quickly."}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {language === "pt-BR" 
                            ? "Chave PIX aparecerá como: SubtleAI" 
                            : "PIX key will appear as: SubtleAI"}
                        </p>
                      </div>
                    )}
                    {paymentGateway === "mercadopago" && (
                      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        {language === "pt-BR" 
                          ? "Aceita PIX, cartão, boleto e parcelamento" 
                          : "Accepts PIX, card, boleto and installments"}
                      </p>
                    )}
                  </div>

                  {/* Payment Method Selection - Only show for Stripe */}
                  {paymentGateway === "stripe" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3">
                        {language === "pt-BR" ? "Método de Pagamento" : "Payment Method"}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm">
                        {language === "pt-BR" ? "Cartão" : "Card"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === "pix"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Smartphone className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm">PIX</span>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {language === "pt-BR" ? "Instantâneo" : "Instant"}
                      </div>
                    </button>
                  </div>
                </div>
                  )}
                </>
              )}

              {/* Card Input - Only for Stripe with card method */}
              {paymentGateway === "stripe" && paymentMethod === "card" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    {language === "pt-BR" ? "Informações do Cartão" : "Card Information"}
                  </label>
                  <div className="border dark:border-gray-700 rounded-lg p-3">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#424770",
                            "::placeholder": {
                              color: "#aab7c4",
                            },
                          },
                          invalid: {
                            color: "#9e2146",
                          },
                        },
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {language === "pt-BR" 
                      ? "Aceitamos todas as principais bandeiras"
                      : "We accept all major credit cards"}
                  </p>
                </div>
              )}

              {/* PIX Info - For Stripe */}
              {paymentGateway === "stripe" && paymentMethod === "pix" && location.currency === "BRL" && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        {language === "pt-BR" ? "Pagamento via PIX" : "PIX Payment"}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {language === "pt-BR"
                          ? "Após clicar em pagar, você receberá um código PIX para pagamento. O acesso será liberado instantaneamente após a confirmação."
                          : "After clicking pay, you'll receive a PIX code. Access will be granted instantly after confirmation."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={(paymentGateway === "stripe" && !stripe) || processing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing 
                  ? (language === "pt-BR" ? "Processando..." : "Processing...")
                  : paymentGateway === "pix_direct"
                  ? (language === "pt-BR" ? "Gerar QR Code PIX" : "Generate PIX QR Code")
                  : paymentGateway === "mercadopago"
                  ? (language === "pt-BR" ? "Ir para MercadoPago" : "Go to MercadoPago")
                  : paymentMethod === "pix" && location.currency === "BRL"
                  ? (language === "pt-BR" ? "Gerar PIX" : "Generate PIX")
                  : (language === "pt-BR" ? "Pagar Agora" : "Pay Now")}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>
                  {paymentGateway === "pix_direct"
                    ? (language === "pt-BR" 
                      ? "PIX seguro e verificado manualmente"
                      : "Secure PIX with manual verification")
                    : paymentGateway === "mercadopago"
                    ? (language === "pt-BR" 
                      ? "Pagamento seguro via MercadoPago"
                      : "Secure payment powered by MercadoPago")
                    : (language === "pt-BR" 
                      ? "Pagamento seguro via Stripe"
                      : "Secure payment powered by Stripe")}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || undefined;
  const creditPackage = searchParams.get("credit") || undefined;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirect = plan ? `?plan=${plan}` : creditPackage ? `?credit=${creditPackage}` : "";
      router.push(`/login?redirect=/checkout${redirect}`);
    }
  }, [status, router, plan, creditPackage]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <Elements stripe={stripePromise}>
        <CheckoutForm plan={plan} creditPackage={creditPackage} />
      </Elements>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}