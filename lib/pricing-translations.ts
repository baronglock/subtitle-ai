// Translations for pricing plans and features
export const pricingTranslations = {
  "pt-BR": {
    // Plan names
    "Free": "Grátis",
    "Pro": "Profissional",
    "Premium": "Premium",
    "Enterprise": "Empresarial",
    
    // Plan descriptions
    "Perfect for trying our service": "Perfeito para testar nosso serviço",
    "For content creators and professionals": "Para criadores de conteúdo e profissionais",
    "For teams and heavy users": "Para equipes e uso intensivo",
    "Custom solutions for large organizations": "Soluções personalizadas para grandes empresas",
    
    // Periods
    "forever": "para sempre",
    "per month": "por mês",
    "custom": "personalizado",
    
    // Features
    "2 hours per month (120 min)": "2 horas por mês (120 min)",
    "10 hours per month (600 min)": "10 horas por mês (600 min)",
    "30 hours per month (1800 min)": "30 horas por mês (1800 min)",
    "Unlimited transcription": "Transcrição ilimitada",
    
    "Standard processing speed": "Velocidade de processamento padrão",
    "2x faster processing": "Processamento 2x mais rápido",
    "5x ultra-fast processing": "Processamento ultra-rápido 5x",
    "10x lightning processing": "Processamento relâmpago 10x",
    
    "Basic transcription quality": "Qualidade básica de transcrição",
    "Premium transcription quality": "Qualidade premium de transcrição",
    "Ultra-premium transcription": "Transcrição ultra-premium",
    "99.9% accuracy guarantee": "Garantia de 99.9% de precisão",
    
    "SRT & TXT export": "Exportação SRT e TXT",
    "All export formats": "Todos os formatos de exportação",
    "All export formats + API": "Todos os formatos + API",
    "Custom integrations": "Integrações personalizadas",
    
    "10 languages": "10 idiomas",
    "50+ languages": "Mais de 50 idiomas",
    "100+ languages": "Mais de 100 idiomas",
    "All languages + dialects": "Todos idiomas + dialetos",
    
    "Google Translate": "Google Tradutor",
    "DeepL translation": "Tradução DeepL",
    "Neural AI translation": "Tradução com IA Neural",
    "Human review option": "Opção de revisão humana",
    
    "Email support": "Suporte por email",
    "Priority support": "Suporte prioritário",
    "24/7 priority support": "Suporte prioritário 24/7",
    "Dedicated account manager": "Gerente de conta dedicado",
    
    "Priority processing": "Processamento prioritário",
    "Speaker detection": "Detecção de falantes",
    "Advanced speaker diarization": "Diarização avançada de falantes",
    "Batch processing": "Processamento em lote",
    
    "API access": "Acesso à API",
    "Full API access": "Acesso completo à API",
    "Custom AI training": "Treinamento de IA personalizado",
    "SLA guarantee": "Garantia de SLA",
    "On-premise deployment": "Implantação local",
    
    // Accuracy
    "~85% accuracy": "~85% de precisão",
    "~92% accuracy": "~92% de precisão",
    "~98% accuracy": "~98% de precisão",
    "~99.9% accuracy": "~99.9% de precisão",
    
    // Technology
    "Gemini Flash (Basic)": "Gemini Flash (Básico)",
    "Gemini Pro (Advanced)": "Gemini Pro (Avançado)",
    "Gemini Ultra (Enterprise)": "Gemini Ultra (Empresarial)",
    "Custom AI Solution": "Solução de IA Personalizada",
    
    // Button texts
    "Get Started": "Começar Grátis",
    "Subscribe Now": "Assinar Agora",
    "Contact Sales": "Falar com Vendas",
    
    // Credit packages
    "Save 15%": "Economize 15%",
    "Save 25%": "Economize 25%",
    "Save 35%": "Economize 35%",
    
    // Additional UI texts
    "Most Popular": "Mais Popular",
    "Best Value": "Melhor Custo-Benefício",
    "minutes": "minutos",
    "hours": "horas",
    "per minute": "por minuto",
    "Credits": "Créditos",
    "Buy Credits": "Comprar Créditos",
    "One-time purchase": "Compra única",
    "No subscription": "Sem assinatura",
    "Valid for 1 year": "Válido por 1 ano",
  },
  "en": {
    // English versions (default - no translation needed)
  }
};

// Helper function to translate a text
export function translatePricingText(text: string, language: string): string {
  if (language === "en") return text;
  
  const translations = pricingTranslations[language as keyof typeof pricingTranslations];
  if (!translations) return text;
  
  return translations[text as keyof typeof translations] || text;
}