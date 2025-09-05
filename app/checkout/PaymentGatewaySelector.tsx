"use client";

import { Dispatch, SetStateAction } from "react";

interface PaymentGatewaySelectorProps {
  paymentGateway: "stripe" | "mercadopago";
  setPaymentGateway: Dispatch<SetStateAction<"stripe" | "mercadopago">>;
  currency: string;
  language: string;
}

export default function PaymentGatewaySelector({ 
  paymentGateway, 
  setPaymentGateway, 
  currency, 
  language 
}: PaymentGatewaySelectorProps) {
  const isBrazil = currency === "BRL";

  if (!isBrazil) {
    // For non-Brazilian users, only show Stripe
    return null;
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3">
        {language === "pt-BR" ? "Escolha como pagar" : "Choose payment method"}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* MercadoPago - Recommended for Brazil */}
        <button
          type="button"
          onClick={() => setPaymentGateway("mercadopago")}
          className={`p-4 rounded-lg border-2 transition-all relative ${
            paymentGateway === "mercadopago"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            {language === "pt-BR" ? "Recomendado" : "Recommended"}
          </div>
          <img 
            src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large.png" 
            alt="MercadoPago" 
            className="h-8 mx-auto mb-2 object-contain"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            PIX {language === "pt-BR" ? "automático" : "automatic"}
          </p>
        </button>

        {/* Stripe */}
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

      {/* Info message */}
      {paymentGateway === "mercadopago" && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ {language === "pt-BR" 
              ? "PIX com confirmação AUTOMÁTICA! Pague e acesse na hora." 
              : "PIX with AUTOMATIC confirmation! Pay and access instantly."}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {language === "pt-BR" 
              ? "Aparecerá como 'SubtleAI' no seu banco" 
              : "Will appear as 'SubtleAI' in your bank"}
          </p>
        </div>
      )}
    </div>
  );
}