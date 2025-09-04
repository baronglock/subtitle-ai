"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
// Translation removed temporarily

export default function ForgotPasswordPage() {
  const locale: string = "en"; // Temporary fix
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success message
    // In production, implement actual password reset
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4"></div>
                <h2 className="text-3xl font-bold mb-2">
                  {locale === "pt-BR" ? "Recuperar Senha" : "Reset Password"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "pt-BR" 
                    ? "Digite seu email para receber instruções" 
                    : "Enter your email to receive instructions"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {locale === "pt-BR" ? "Enviar Email de Recuperação" : "Send Reset Email"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-blue-500 hover:text-blue-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {locale === "pt-BR" ? "Voltar ao login" : "Back to login"}
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {locale === "pt-BR" ? "Email Enviado!" : "Email Sent!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {locale === "pt-BR" 
                  ? `Enviamos instruções para ${email}` 
                  : `We sent instructions to ${email}`}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {locale === "pt-BR" ? "Voltar ao login" : "Back to login"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}