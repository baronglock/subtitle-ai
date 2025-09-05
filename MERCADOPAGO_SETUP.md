# 🇧🇷 Configuração do MercadoPago

## ✅ MercadoPago vs Stripe para PIX

### MercadoPago (RECOMENDADO para Brasil)
- ✅ **PIX aprovado instantaneamente** - Sem necessidade de aprovação beta
- ✅ **100% integrado** com bancos brasileiros
- ✅ **Taxas competitivas** para o mercado brasileiro
- ✅ **Suporte em português**
- ✅ **Checkout transparente** ou redirect

### Stripe
- ⚠️ PIX em beta (requer aprovação manual)
- ⚠️ Pode levar dias/semanas para ativação
- ✅ Melhor para pagamentos internacionais
- ✅ Ótimo para cartões de crédito

## 📝 Como Configurar MercadoPago

### 1️⃣ Criar Conta MercadoPago

1. Acesse [MercadoPago Developers](https://www.mercadopago.com.br/developers)
2. Clique em **"Criar conta"**
3. Escolha **"Quero integrar o MercadoPago"**
4. Complete o cadastro com seus dados

### 2️⃣ Obter Credenciais

1. No painel, vá em **"Suas integrações"**
2. Clique em **"Criar aplicação"**
3. Nome: `SubtleAI`
4. Após criar, você verá:
   - **Public Key** (chave pública)
   - **Access Token** (token de acesso)

### 3️⃣ Configurar no .env.local

```env
# MercadoPago (Production)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Para testes (Sandbox)
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4️⃣ Configurar Webhooks

1. No painel MercadoPago, vá em **"Webhooks"**
2. Adicione a URL:
   ```
   https://seu-dominio.vercel.app/api/payment/mercadopago/webhook
   ```
3. Selecione os eventos:
   - ✅ Payment created
   - ✅ Payment updated

### 5️⃣ Testar Pagamentos

#### Modo Sandbox (Teste)
Use as credenciais de teste e os dados fictícios:

**Para PIX:**
- CPF: 12345678909
- Email: test_user@testuser.com

**Para Cartão:**
```
Número: 5031 4332 1540 6351
Nome: APRO (aprovado) ou OTHE (recusado)
CVV: 123
Vencimento: 11/25
```

#### Modo Produção
Use as credenciais de produção após testar tudo.

## 🎯 Fluxo de Pagamento Implementado

1. **Usuário escolhe plano/créditos**
2. **Seleciona MercadoPago como gateway**
3. **Sistema cria "preference" no MercadoPago**
4. **Usuário é redirecionado para checkout do MercadoPago**
5. **Escolhe PIX e paga**
6. **MercadoPago envia webhook**
7. **Sistema atualiza conta do usuário**
8. **Usuário tem acesso imediato**

## 🔧 Comandos Úteis

### Verificar se MercadoPago está funcionando:
```bash
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Criar pagamento teste:
```bash
node -e "
const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({ 
  accessToken: 'YOUR_ACCESS_TOKEN'
});
const preference = new Preference(client);
preference.create({
  body: {
    items: [{
      title: 'Test',
      quantity: 1,
      unit_price: 10
    }]
  }
}).then(console.log);
"
```

## 🚀 Status da Implementação

✅ **SDK instalado** - mercadopago npm package
✅ **API Routes criadas** - create-preference e webhook
✅ **UI atualizada** - Seleção entre MercadoPago e Stripe
✅ **PIX habilitado** - Funciona imediatamente
⏳ **Aguardando** - Suas credenciais no .env.local

## 📞 Suporte MercadoPago

- **Chat ao vivo**: No painel de desenvolvedores
- **Email**: developers@mercadopago.com
- **Docs**: https://www.mercadopago.com.br/developers/pt/docs
- **Status API**: https://status.mercadopago.com/

## 🎉 Vantagens do MercadoPago

1. **PIX instantâneo** - Sem espera por aprovação
2. **Parcelamento** - Até 12x no cartão
3. **Boleto bancário** - Alternativa popular
4. **Dinheiro em conta** - Saldo MercadoPago
5. **QR Code** - Pagamento presencial
6. **Split de pagamento** - Para marketplaces
7. **Menor taxa para PIX** - Mais barato que cartão

---

**IMPORTANTE**: O MercadoPago já está 100% integrado no código. Você só precisa adicionar as credenciais no arquivo `.env.local` para começar a usar!