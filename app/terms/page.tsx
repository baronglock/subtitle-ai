"use client";

// Translation removed temporarily

export default function TermsPage() {
  const locale: string = "en"; // Temporary fix

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">
            {locale === "pt-BR" ? "Termos de Serviço" : "Terms of Service"}
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            {locale === "pt-BR" ? (
              <>
                <h2>1. Aceitação dos Termos</h2>
                <p>Ao usar o SubtleAI, você concorda com estes termos de serviço.</p>
                
                <h2>2. Uso do Serviço</h2>
                <p>Nosso serviço permite transcrever e traduzir áudio e vídeo usando IA.</p>
                
                <h2>3. Conta do Usuário</h2>
                <p>Você é responsável por manter a segurança de sua conta.</p>
                
                <h2>4. Pagamento e Assinatura</h2>
                <p>Os planos pagos são cobrados mensalmente. Você pode cancelar a qualquer momento.</p>
                
                <h2>5. Privacidade</h2>
                <p>Seus arquivos são processados com segurança e excluídos após o processamento.</p>
                
                <h2>6. Limitação de Responsabilidade</h2>
                <p>O SubtleAI não se responsabiliza por erros na transcrição ou tradução.</p>
                
                <h2>7. Modificações</h2>
                <p>Podemos atualizar estes termos periodicamente.</p>
              </>
            ) : (
              <>
                <h2>1. Acceptance of Terms</h2>
                <p>By using SubtleAI, you agree to these terms of service.</p>
                
                <h2>2. Use of Service</h2>
                <p>Our service allows you to transcribe and translate audio and video using AI.</p>
                
                <h2>3. User Account</h2>
                <p>You are responsible for maintaining the security of your account.</p>
                
                <h2>4. Payment and Subscription</h2>
                <p>Paid plans are billed monthly. You can cancel at any time.</p>
                
                <h2>5. Privacy</h2>
                <p>Your files are securely processed and deleted after processing.</p>
                
                <h2>6. Limitation of Liability</h2>
                <p>SubtleAI is not responsible for errors in transcription or translation.</p>
                
                <h2>7. Modifications</h2>
                <p>We may update these terms periodically.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}