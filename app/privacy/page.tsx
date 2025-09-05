"use client";

// Translation removed temporarily

export default function PrivacyPage() {
  const locale: string = "en"; // Temporary fix

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">
            {locale === "pt-BR" ? "Política de Privacidade" : "Privacy Policy"}
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            {locale === "pt-BR" ? (
              <>
                <h2>1. Informações que Coletamos</h2>
                <p>Coletamos seu email, nome e arquivos enviados para transcrição.</p>
                
                <h2>2. Como Usamos suas Informações</h2>
                <p>Usamos suas informações para fornecer o serviço de transcrição e melhorar nossa plataforma.</p>
                
                <h2>3. Armazenamento de Dados</h2>
                <p>Seus arquivos são temporariamente armazenados durante o processamento e excluídos automaticamente após a conclusão.</p>
                
                <h2>4. Segurança</h2>
                <p>Utilizamos criptografia e medidas de segurança para proteger seus dados.</p>
                
                <h2>5. Compartilhamento de Dados</h2>
                <p>Não vendemos ou compartilhamos seus dados com terceiros.</p>
                
                <h2>6. Seus Direitos</h2>
                <p>Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.</p>
                
                <h2>7. Cookies</h2>
                <p>Usamos cookies para melhorar sua experiência no site.</p>
                
                <h2>8. Contato</h2>
                <p>Para questões sobre privacidade, entre em contato: support@subtleai.com</p>
              </>
            ) : (
              <>
                <h2>1. Information We Collect</h2>
                <p>We collect your email, name, and files uploaded for transcription.</p>
                
                <h2>2. How We Use Your Information</h2>
                <p>We use your information to provide transcription services and improve our platform.</p>
                
                <h2>3. Data Storage</h2>
                <p>Your files are temporarily stored during processing and automatically deleted after completion.</p>
                
                <h2>4. Security</h2>
                <p>We use encryption and security measures to protect your data.</p>
                
                <h2>5. Data Sharing</h2>
                <p>We do not sell or share your data with third parties.</p>
                
                <h2>6. Your Rights</h2>
                <p>You can request access, correction, or deletion of your data at any time.</p>
                
                <h2>7. Cookies</h2>
                <p>We use cookies to improve your site experience.</p>
                
                <h2>8. Contact</h2>
                <p>For privacy questions, contact: support@subtleai.com</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}