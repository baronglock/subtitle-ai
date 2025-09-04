# 🚀 Guia Completo de Configuração - SubtleAI

## 📋 Resumo das Novas Funcionalidades

1. ✅ **Rebranding para SubtleAI** com logo minimalista
2. ✅ **Integração com Stripe** para pagamentos reais
3. ✅ **Sistema de Email** com redirecionamento inteligente
4. ✅ **Correção do fluxo de pagamento** para usuários logados

---

## 1️⃣ Configuração do Stripe

### Passo 1: Criar conta no Stripe
1. Acesse [https://stripe.com](https://stripe.com)
2. Clique em "Start now" e crie sua conta
3. Complete o processo de verificação da conta

### Passo 2: Obter as chaves da API
1. No Dashboard do Stripe, vá para **Developers → API keys**
2. Copie as chaves:
   - **Publishable key**: começa com `pk_test_...` (modo teste) ou `pk_live_...` (produção)
   - **Secret key**: começa com `sk_test_...` (modo teste) ou `sk_live_...` (produção)

### Passo 3: Configurar produtos e preços no Stripe
1. Vá para **Products → Add product**
2. Crie os produtos:

**Plano Pro**
- Nome: Pro Plan
- Preço: $29.00
- Recorrência: Mensal
- ID do produto: Anote o ID (price_...)

**Plano Premium**
- Nome: Premium Plan  
- Preço: $99.00
- Recorrência: Mensal
- ID do produto: Anote o ID (price_...)

### Passo 4: Configurar Webhook (Opcional - para renovações automáticas)
1. Vá para **Developers → Webhooks**
2. Clique em "Add endpoint"
3. URL do endpoint: `https://seu-dominio.vercel.app/api/webhooks/stripe`
4. Eventos para ouvir:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

---

## 2️⃣ Configuração do Sistema de Email

### Opção A: Usando Gmail

#### Passo 1: Ativar verificação em duas etapas
1. Acesse [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Clique em "Verificação em duas etapas"
3. Ative a verificação (se ainda não estiver ativa)

#### Passo 2: Criar senha de app
1. Ainda em Segurança, procure por "Senhas de app"
2. Se não aparecer, certifique-se que a verificação em duas etapas está ativa
3. Clique em "Senhas de app"
4. Selecione:
   - App: Mail
   - Dispositivo: Outro (digite "SubtleAI")
5. Clique em "Gerar"
6. **IMPORTANTE**: Copie a senha de 16 caracteres que aparecer (não terá espaços)

### Opção B: Usando outro provedor SMTP

Para outros provedores (Outlook, Yahoo, etc), você precisará:
- Servidor SMTP
- Porta (geralmente 587 para TLS ou 465 para SSL)
- Email e senha

---

## 3️⃣ Configuração do Email Empresarial

### Para que os emails apareçam como vindo de support@subtleai.com:

#### Opção 1: Domínio próprio (Recomendado)
1. Compre o domínio subtleai.com (ou similar)
2. Configure o email com:
   - Google Workspace ($6/mês)
   - Zoho Mail (grátis até 5 usuários)
   - Outros provedores

#### Opção 2: Usar email existente (Temporário)
- Os emails serão enviados do seu email pessoal
- Mas aparecerão com o nome "SubtleAI Support"
- O reply-to direcionará para o email do cliente

---

## 4️⃣ Configuração no Vercel

### Adicionar variáveis de ambiente:

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá para **Settings → Environment Variables**
3. Adicione as seguintes variáveis:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_51... (sua secret key do Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51... (sua public key do Stripe)

# Email
EMAIL_FROM=support@subtleai.com (ou seu email empresarial)
EMAIL_TO=seu.email.pessoal@gmail.com (onde você quer receber)
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop (senha de app do Gmail, SEM espaços)

# Se já não estiverem configuradas:
NEXTAUTH_SECRET=gere_uma_string_aleatoria_aqui
NEXTAUTH_URL=https://seu-app.vercel.app

# Gemini AI (obrigatório)
GEMINI_API_KEY=sua_chave_gemini

# Cloudflare R2 (se estiver usando)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=...
R2_BUCKET_NAME=...
```

### Como gerar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```
Ou use: https://generate-secret.vercel.app/32

---

## 5️⃣ Testar a Configuração

### Teste 1: Pagamentos
1. Use cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVV: Qualquer 3 dígitos
   - CEP: Qualquer CEP válido

2. Fluxo de teste:
   - Faça login no site
   - Vá para Pricing
   - Clique em "Start Free Trial" do plano Pro
   - Complete o pagamento
   - Verifique no Dashboard do Stripe se o pagamento aparece

### Teste 2: Email
1. Vá para a página Contact
2. Preencha o formulário
3. Envie a mensagem
4. Verifique:
   - Se você recebeu o email no seu email pessoal
   - Se o cliente recebeu a confirmação
   - Se ao responder, vai para o email correto

---

## 6️⃣ Modo Produção

Quando estiver pronto para produção:

### Stripe
1. Complete a verificação da conta no Stripe
2. Troque as chaves de teste pelas chaves de produção:
   - `sk_test_...` → `sk_live_...`
   - `pk_test_...` → `pk_live_...`

### Domínio
1. Configure seu domínio personalizado no Vercel
2. Atualize NEXTAUTH_URL para o domínio final

### Email
1. Configure email profissional com domínio próprio
2. Configure SPF, DKIM e DMARC para melhor entregabilidade

---

## 7️⃣ Monitoramento

### Dashboard do Stripe
- Acompanhe pagamentos em tempo real
- Configure alertas para pagamentos falhos
- Monitore disputas e chargebacks

### Vercel Analytics
- Ative Analytics no projeto
- Monitore performance e erros

### Logs
- Use o Vercel Functions Log para debug
- Configure alertas para erros críticos

---

## 🆘 Troubleshooting

### Erro: "Payment failed"
- Verifique se as chaves do Stripe estão corretas
- Confirme que está usando as chaves do mesmo ambiente (test/live)
- Verifique os logs no Dashboard do Stripe

### Erro: "Email not sending"
- Confirme que a senha de app está correta (sem espaços)
- Verifique se a verificação em duas etapas está ativa
- Teste com outro provedor SMTP se necessário

### Erro: "Redirect to login"
- Limpe cookies e cache do navegador
- Verifique se NEXTAUTH_URL está correto
- Confirme que NEXTAUTH_SECRET está configurado

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel
2. Consulte a documentação do Stripe
3. Entre em contato através do GitHub Issues

---

## ✅ Checklist Final

- [ ] Conta Stripe criada e verificada
- [ ] Chaves do Stripe adicionadas ao Vercel
- [ ] Senha de app do Gmail gerada
- [ ] Variáveis de email configuradas
- [ ] NEXTAUTH configurado corretamente
- [ ] Teste de pagamento realizado
- [ ] Teste de email realizado
- [ ] Deploy no Vercel bem-sucedido

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0