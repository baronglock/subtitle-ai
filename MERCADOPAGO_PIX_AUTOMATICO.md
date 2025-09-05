# 🚀 MercadoPago PIX Automático - Configuração Completa

## ✅ Por que MercadoPago é a melhor opção para PIX?

- ✅ **PIX 100% automático** - Cliente paga, sistema libera na hora!
- ✅ **Nome da empresa no PIX** - Aparece "SubtleAI" não seus dados pessoais
- ✅ **Webhook automático** - Sem confirmação manual
- ✅ **Aceita USD também** - Para clientes internacionais via cartão
- ✅ **Sem burocracia** - Ativa na hora

## 📝 Passo a Passo Completo

### 1️⃣ Criar Conta MercadoPago Empresarial

1. Acesse: https://www.mercadopago.com.br/hub/registration/landing
2. Escolha **"Quero vender"**
3. Selecione **"Pessoa Jurídica"** (se tiver CNPJ) ou **"MEI"**
   - Com conta empresarial, aparece o nome da empresa no PIX!
4. Complete o cadastro

### 2️⃣ Configurar Nome que Aparece no PIX

1. No painel MercadoPago, vá em **"Seu negócio"**
2. Em **"Dados do negócio"**:
   - Nome fantasia: `SubtleAI`
   - Categoria: `Tecnologia e Software`
3. **IMPORTANTE**: Este nome aparecerá no PIX do cliente!

### 3️⃣ Obter Credenciais de Produção

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Clique em **"Criar aplicação"**
3. Nome: `SubtleAI Produção`
4. Marque: **"Pagamentos online"**
5. Após criar, copie:
   - **Access Token** (produção)
   - **Public Key** (produção)

### 4️⃣ Configurar no `.env.local`

```env
# MercadoPago Produção (USE ESTAS!)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Secret (você cria uma senha)
MERCADOPAGO_WEBHOOK_SECRET=uma-senha-super-secreta-123

# URL do seu site
NEXTAUTH_URL=https://seu-site.vercel.app
```

### 5️⃣ Configurar Webhook para Confirmação Automática

1. No painel de desenvolvedores, vá em **"Webhooks"**
2. Clique em **"Criar webhook"**
3. URL do webhook:
   ```
   https://seu-site.vercel.app/api/payment/mercadopago/webhook
   ```
4. Eventos para receber:
   - ✅ payment.created
   - ✅ payment.updated
5. Modo: **Produção**
6. Salve e **COPIE O WEBHOOK SECRET**

### 6️⃣ Como Funciona o PIX Automático

1. **Cliente escolhe pagar com MercadoPago**
2. **Sistema gera QR Code do PIX**
3. **Cliente paga pelo app do banco**
   - Vê "SubtleAI" como recebedor
4. **MercadoPago recebe o PIX**
5. **Webhook é acionado automaticamente**
6. **Sistema libera acesso instantaneamente**
7. **Cliente recebe email de confirmação**

## 💰 Taxas do MercadoPago

- **PIX**: 0,99% (máximo R$ 10)
- **Cartão de crédito**: 4,99% 
- **Boleto**: R$ 4,90 por boleto pago
- **Recebimento**: Na hora ou em 1 dia útil

## 🌍 Pagamentos Internacionais (USD)

O MercadoPago também aceita cartões internacionais:
1. Cliente dos EUA/Europa paga em USD
2. MercadoPago converte para BRL
3. Você recebe em reais

## 🔧 Testar Antes de Ir Pro

### Credenciais de Teste
No painel, pegue as credenciais de teste:
```env
# Para testes (use primeiro estas)
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-xxxxxxxxxxxxx
```

### Cartões de Teste
```
Aprovado: 5031 4332 1540 6351
Recusado: 5031 4332 1540 0011
Nome: APRO ou OTHE
CVV: 123
Data: 11/25
```

### PIX de Teste
- Use qualquer CPF/CNPJ
- Pagamento aprovado instantaneamente

## ✨ Vantagens do Setup

1. **100% Automático** - Sem confirmação manual
2. **Nome da Empresa** - Profissional e seguro
3. **Multi-moeda** - BRL e USD
4. **Webhook Confiável** - Sempre funciona
5. **Dashboard Completo** - Veja todas vendas
6. **Suporte 24/7** - Em português

## 🚨 Checklist Final

- [ ] Conta MercadoPago empresarial criada
- [ ] Nome da empresa configurado
- [ ] Credenciais no `.env.local`
- [ ] Webhook configurado
- [ ] Testado com credenciais de teste
- [ ] Mudado para credenciais de produção

## 📞 Suporte

- **Chat MercadoPago**: No próprio painel
- **Telefone**: 0800 775 0870
- **Email**: developers@mercadopago.com

---

**PRONTO!** Agora você tem PIX 100% automático com nome da empresa! 🎉

Sem confirmação manual, sem expor dados pessoais, totalmente profissional!