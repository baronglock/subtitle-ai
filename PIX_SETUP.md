# 🇧🇷 Configuração do PIX no Stripe

## ⚠️ IMPORTANTE: PIX no Stripe

O PIX está em **BETA** no Stripe e requer ativação manual. Siga estes passos:

## 1️⃣ Ativar PIX na sua conta Stripe

### Passo 1: Verificar disponibilidade
1. Entre no [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Settings → Payment methods**
3. Procure por "PIX" na lista

### Passo 2: Se PIX não aparecer
1. Você precisa solicitar acesso ao beta
2. Entre em contato com o suporte Stripe:
   - Chat ao vivo no dashboard
   - Ou email para support@stripe.com
3. Diga: "I need to enable PIX payment method for Brazilian customers"

### Passo 3: Configuração após aprovação
1. Quando aprovado, vá em **Settings → Payment methods**
2. Ative **PIX**
3. Configure:
   - ✅ Enable for one-time payments
   - ✅ Enable for subscriptions (se disponível)

## 2️⃣ Configuração no Código (Já Implementada!)

O código já está configurado para:
- Detectar usuários brasileiros automaticamente
- Oferecer PIX como opção de pagamento
- Processar pagamentos PIX via Stripe Checkout

```javascript
// Métodos de pagamento para Brasil
["card", "pix", "boleto"]

// Métodos para outros países
["card"]
```

## 3️⃣ Teste do PIX

### Modo Teste (Sandbox)
No modo teste, o Stripe simula PIX instantaneamente:
1. Use qualquer CPF válido (ex: 123.456.789-00)
2. O pagamento é aprovado imediatamente
3. Não precisa de app bancário real

### Modo Produção
1. Cliente escolhe PIX no checkout
2. Stripe gera código PIX
3. Cliente paga via app bancário
4. Confirmação em segundos
5. Webhook notifica seu sistema

## 4️⃣ Alternativas se PIX não estiver disponível

### Opção 1: Use apenas Cartão + Boleto
```javascript
// Em create-session/route.ts
["card", "boleto"] // Remove "pix" da lista
```

### Opção 2: Use MercadoPago (Melhor para PIX)
MercadoPago tem suporte completo para PIX no Brasil:
1. Crie conta em [MercadoPago](https://www.mercadopago.com.br)
2. Integração mais simples para PIX
3. Taxas competitivas

### Opção 3: PagSeguro
Outra opção popular no Brasil com PIX nativo

## 5️⃣ Status Atual no seu Site

✅ **Código preparado** - Tudo configurado
⚠️ **Ativação pendente** - Precisa ativar no Stripe Dashboard
❌ **Se não aparecer** - Solicite acesso ao beta

## 6️⃣ Comandos Úteis

### Verificar se PIX está ativo (via Stripe CLI):
```bash
stripe payment_methods list --type=pix
```

### Testar pagamento PIX:
```bash
stripe payment_intents create \
  --amount=5000 \
  --currency=brl \
  --payment-method-types=pix
```

## 📞 Suporte

### Stripe
- Chat: Dashboard → Help
- Email: support@stripe.com
- Mencione: "PIX payment method for Brazil"

### Alternativa Recomendada
Se o Stripe demorar para aprovar PIX, considere:
1. **MercadoPago** - Melhor para Brasil
2. **PagSeguro** - Alternativa popular
3. **Continuar só com cartão/boleto** - Funciona bem

---

**NOTA**: Boleto já está funcionando como alternativa para clientes que preferem não usar cartão!