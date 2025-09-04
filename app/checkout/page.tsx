"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ArrowLeft, CreditCard, Shield } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const getPlanPrice = (planName: string) => {
    switch (planName) {
      case "pro":
        return 2900; // $29.00 in cents
      case "premium":
        return 9900; // $99.00 in cents
      default:
        return 0;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    // Create payment intent on the server
    const response = await fetch("/api/payment/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: getPlanPrice(plan),
        plan: plan,
        userId: session?.user?.id,
      }),
    });

    const { clientSecret } = await response.json();

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

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
      // Update user subscription in database
      await fetch("/api/payment/update-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          plan: plan,
          paymentIntentId: result.paymentIntent?.id,
        }),
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  const planDetails = {
    pro: {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: [
        "10 hours per month (600 min)",
        "Premium quality transcription",
        "All export formats",
        "50+ languages",
        "Premium AI translation",
        "Priority support",
        "2x faster processing",
        "Speaker detection",
      ],
    },
    premium: {
      name: "Premium",
      price: "$99",
      period: "/month",
      features: [
        "30 hours per month (1800 min)",
        "Ultra-premium transcription",
        "All export formats + API",
        "100+ languages",
        "Neural AI translation",
        "24/7 priority support",
        "5x faster processing",
        "Advanced speaker diarization",
      ],
    },
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/pricing" className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to pricing
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-fit">
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          <div className="border-b dark:border-gray-700 pb-4 mb-4">
            <h3 className="text-xl font-semibold">{currentPlan?.name} Plan</h3>
            <div className="text-3xl font-bold mt-2">
              {currentPlan?.price}
              <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                {currentPlan?.period}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold mb-3">Included features:</h4>
            {currentPlan?.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Payment Information</h2>

          {succeeded ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-500 text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Card Information
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
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : `Subscribe to ${currentPlan?.name}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <Elements stripe={stripePromise}>
        <CheckoutForm plan={plan} />
      </Elements>
    </div>
  );
}