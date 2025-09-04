# 🚀 GUIA RÁPIDO - CONFIGURAÇÃO EM 10 MINUTOS

## O que foi implementado:
- ✅ **SubtleAI** - Novo nome e logo minimalista
- ✅ **Pagamentos com Stripe** - Checkout funcional para planos Pro/Premium  
- ✅ **Sistema de Email** - Suporte com redirecionamento inteligente
- ✅ **Correção de bugs** - Usuários logados agora acessam checkout corretamente

---

## 📋 PASSO A PASSO RÁPIDO

### 1️⃣ STRIPE (5 minutos)
1. Entre em https://stripe.com e crie conta
2. Vá em **Developers → API Keys**
3. Copie as duas chaves (começam com `pk_test_` e `sk_test_`)

### 2️⃣ EMAIL - GMAIL (3 minutos)
1. Entre em https://myaccount.google.com/security
2. Ative **Verificação em duas etapas** (se não estiver ativa)
3. Clique em **Senhas de app**
4. Crie senha para "Mail" → "Outro" → Digite "SubtleAI"
5. Copie a senha de 16 caracteres (sem espaços)

### 3️⃣ VERCEL (2 minutos)
1. Entre no seu projeto: https://vercel.com/dashboard
2. Vá em **Settings → Environment Variables**
3. Adicione estas variáveis:

```bash
# Copie e cole exatamente assim:

STRIPE_SECRET_KEY=(cole a chave sk_test_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(cole a chave pk_test_...)

EMAIL_FROM=support@subtleai.com
EMAIL_TO=(seu email pessoal)
EMAIL_APP_PASSWORD=(senha de 16 caracteres do Gmail, sem espaços)

# Se ainda não tiver:
NEXTAUTH_SECRET=(gere em: https://generate-secret.vercel.app/32)
NEXTAUTH_URL=https://seu-app.vercel.app
```

4. Clique em **Save**
5. Vá em **Deployments** → **Redeploy** → **Redeploy**

---

## ✅ TESTAR

### Teste de Pagamento:
1. Acesse seu site
2. Faça login
3. Vá em Pricing → Escolha um plano
4. Use o cartão de teste: `4242 4242 4242 4242`
5. Data: qualquer futura, CVV: 123, CEP: qualquer

### Teste de Email:
1. Vá em Contact
2. Envie uma mensagem
3. Verifique seu email pessoal

---

## 🎯 IMPORTANTE

### Para receber pagamentos REAIS:
1. Complete verificação no Stripe
2. Troque as chaves de teste pelas de produção:
   - `sk_test_` → `sk_live_`
   - `pk_test_` → `pk_live_`

### Para email profissional:
- Compre domínio subtleai.com
- Configure com Google Workspace ou Zoho Mail

---

## 🔴 PROBLEMAS COMUNS

**"Pagamento não funciona"**
→ Verifique se copiou as chaves corretas do Stripe

**"Email não envia"**
→ Confirme que a senha do Gmail não tem espaços
→ Verifique se 2FA está ativo

**"Redireciona para login"**
→ Limpe cookies do navegador
→ Confirme NEXTAUTH_URL está correto

---

## 📱 CONTATO

Problemas? Abra issue em:
https://github.com/baronglock/subtitle-ai/issues

---

**Tempo total de configuração: ~10 minutos**
**Status: PRONTO PARA DEPLOY ✅**