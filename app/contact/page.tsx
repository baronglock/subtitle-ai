"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSession } from "next-auth/react";

export default function ContactPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    subject: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus("success");
        setIsSubmitted(true);
        setTicketNumber(data.ticketNumber);
        // Reset form after showing success
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: ""
          });
        }, 2000);
      } else {
        setStatus("error");
        alert(language === "pt-BR" 
          ? "Erro ao enviar mensagem. Tente novamente."
          : "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("error");
      alert(language === "pt-BR" 
        ? "Erro ao enviar mensagem. Verifique sua conexão."
        : "Failed to send message. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {language === "pt-BR" ? "Entre em Contato" : "Contact Us"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {language === "pt-BR" 
              ? "Estamos aqui para ajudar com suas dúvidas" 
              : "We're here to help with your questions"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">
              {language === "pt-BR" ? "Envie uma Mensagem" : "Send a Message"}
            </h2>
            
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "pt-BR" ? "Nome" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "pt-BR" ? "Assunto" : "Subject"}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "pt-BR" ? "Mensagem" : "Message"}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {language === "pt-BR" ? "Enviando..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {language === "pt-BR" ? "Enviar Mensagem" : "Send Message"}
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "pt-BR" ? "Ticket Criado!" : "Ticket Created!"}
                </h3>
                {ticketNumber && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{ticketNumber}
                    </p>
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  {language === "pt-BR" 
                    ? "Responderemos em até 24 horas!" 
                    : "We'll respond within 24 hours!"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {language === "pt-BR" 
                    ? "Você receberá uma cópia por email" 
                    : "You'll receive a copy by email"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">support@subtleai.com</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === "pt-BR" ? "Suporte Rápido" : "Quick Support"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === "pt-BR" 
                      ? "Resposta em até 24 horas" 
                      : "Response within 24 hours"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">
                {language === "pt-BR" ? "Precisa de Ajuda Urgente?" : "Need Urgent Help?"}
              </h3>
              <p className="text-sm opacity-90">
                {language === "pt-BR" 
                  ? "Clientes Pro e Enterprise têm suporte prioritário com resposta em até 2 horas." 
                  : "Pro and Enterprise customers get priority support with response within 2 hours."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}