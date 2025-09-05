# 💚 PIX Direto Simples - Configuração Super Fácil!

## ✨ O que é o PIX Direto?

É a forma **MAIS SIMPLES** de receber PIX no seu app:
- ✅ **Vai direto pra sua conta pessoal/empresarial**
- ✅ **Sem intermediários** (MercadoPago, Stripe, etc)
- ✅ **Sem taxas extras** (só a taxa do seu banco)
- ✅ **QR Code gerado automaticamente**
- ✅ **Você confirma manualmente quando receber**

## 🚀 Como Configurar (Super Rápido!)

### 1️⃣ Adicione sua chave PIX no `.env.local`:

```env
# Sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
PIX_KEY=11999999999
# ou
PIX_KEY=seu.email@gmail.com
# ou 
PIX_KEY=12345678901234  # CNPJ
# ou
PIX_KEY=12345678901     # CPF

# Nome que aparece pro cliente (opcional)
PIX_RECEIVER_NAME=SubtleAI

# Cidade (opcional)
PIX_CITY=São Paulo

# Email pra receber notificações de pagamento
ADMIN_EMAIL=seu.email@gmail.com

# Senha secreta pra confirmar pagamentos (invente uma)
ADMIN_SECRET=uma-senha-secreta-qualquer-123
```

### 2️⃣ Como Funciona?

1. **Cliente escolhe pagar**
   - Seleciona "PIX Direto" (já é o padrão!)
   - Clica em "Gerar QR Code PIX"

2. **QR Code é mostrado**
   - Cliente escaneia com app do banco
   - Ou copia o código PIX Copia e Cola
   - Aparece "SubtleAI" como recebedor

3. **Cliente faz o PIX**
   - Vai direto pra sua conta
   - Sem intermediários!

4. **Você recebe email automático**
   - Aviso: "Fulano fez PIX de R$ XX"
   - Link pra confirmar o pagamento

5. **Você confirma**
   - Clica no link do email
   - Cliente ganha acesso instantâneo!

## 📧 Email de Notificação

Quando alguém gerar um PIX, você recebe:

```
Assunto: ⏳ PIX Pendente - cliente@email.com

Novo PIX Pendente
Cliente: cliente@email.com
Valor: R$ 49,90
Produto: Plano Pro - 500 minutos/mês
Horário: 05/09/2025 14:30

CLIQUE AQUI PARA CONFIRMAR PAGAMENTO
```

## ✅ Para Confirmar Pagamento

Após receber o PIX na sua conta:
1. Clique no link do email
2. Ou acesse: `seu-site.com/api/payment/pix-simple/confirm?orderId=XXX&secret=sua-senha`
3. Pronto! Cliente tem acesso instantâneo

## 🎯 Vantagens

- **Sem burocracia** - Não precisa criar conta em gateway
- **Sem documentação** - Não precisa enviar documentos
- **Sem aprovação** - Funciona imediatamente
- **Sem taxas extras** - Só a taxa normal do PIX do seu banco
- **Controle total** - Dinheiro vai direto pra você
- **Privacidade** - Sem compartilhar dados com terceiros

## 🔒 Segurança

- Link de confirmação tem senha secreta
- Pagamentos expiram em 30 minutos se não confirmados
- Histórico de todos os pagamentos
- Email de notificação pro admin e pro cliente

## 💡 Dicas

1. **Use chave PIX aleatória** - Mais privacidade
2. **Configure email SMTP** - Para receber notificações
3. **Confirme rápido** - Cliente fica feliz!
4. **Guarde a senha secreta** - Só você deve saber

## 🤔 Perguntas Frequentes

**P: E se eu esquecer de confirmar?**
R: Cliente pode entrar em contato. Você confirma manualmente pelo link.

**P: Posso usar conta PJ?**
R: Sim! Use CNPJ como chave PIX.

**P: E se o PIX cair em outro horário?**
R: Você recebe email e confirma quando puder.

**P: É seguro?**
R: Sim! Só você tem acesso ao link de confirmação com senha.

## 🎉 Pronto!

Agora você recebe PIX direto na sua conta! 

Sem complicação, sem burocracia, sem taxas extras.

---

**IMPORTANTE**: Se preferir automação total, você pode depois migrar para MercadoPago ou Stripe. Mas pra começar, PIX Direto é perfeito! 🚀