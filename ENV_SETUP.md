# 🔧 Configuração Rápida das Variáveis de Ambiente

## Copie e cole no Vercel:

```env
# ============================================
# CONFIGURAÇÃO MÍNIMA NECESSÁRIA
# ============================================

# 🔐 AUTENTICAÇÃO (Obrigatório)
NEXTAUTH_SECRET=gere_com_openssl_rand_base64_32
NEXTAUTH_URL=https://seu-app.vercel.app

# 💳 STRIPE (Para pagamentos)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# 📧 EMAIL (Para suporte)
EMAIL_FROM=support@subtleai.com
EMAIL_TO=seu.email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop

# 🤖 GEMINI AI (Obrigatório)
GEMINI_API_KEY=AIza...

# ☁️ CLOUDFLARE R2 (Para uploads)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://....r2.cloudflarestorage.com
R2_BUCKET_NAME=subtitle-ai
R2_ACCOUNT_ID=...
```

## Links Rápidos para Obter as Chaves:

1. **NEXTAUTH_SECRET**: 
   - Gere em: https://generate-secret.vercel.app/32

2. **STRIPE**:
   - Dashboard: https://dashboard.stripe.com/apikeys
   - Modo teste primeiro, depois produção

3. **EMAIL (Gmail)**:
   - Senhas de app: https://myaccount.google.com/apppasswords
   - Precisa ter 2FA ativado

4. **GEMINI AI**:
   - Obter chave: https://makersuite.google.com/app/apikey
   - É gratuito!

5. **CLOUDFLARE R2**:
   - Dashboard: https://dash.cloudflare.com
   - Criar bucket → Gerar credenciais

## Ordem de Configuração:

1. ✅ Configure primeiro no arquivo `.env.local` para testar localmente
2. ✅ Teste com `npm run dev`
3. ✅ Depois adicione no Vercel Dashboard → Settings → Environment Variables
4. ✅ Faça redeploy no Vercel

## Teste Rápido:

```bash
# Local
npm run dev

# Testar email
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"test@test.com","subject":"Teste","message":"Testando"}'

# Testar pagamento (use cartão de teste 4242 4242 4242 4242)
# Acesse: http://localhost:3000/pricing
```