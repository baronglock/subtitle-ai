# 🚀 GUIA COMPLETO - CONFIGURAÇÃO DO MERCADOPAGO PARA SUBTLEAI

## 📌 IMPORTANTE: LEIA ESTE DOCUMENTO!
Este é o **ÚNICO DOCUMENTO** que você precisa seguir para configurar tudo!

---

# PARTE 1: CRIAR CONTA MERCADOPAGO EMPRESARIAL

## Passo 1.1: Acessar Site do MercadoPago

1. Abra seu navegador
2. Digite: **https://www.mercadopago.com.br**
3. Clique no botão **"Criar conta"** (canto superior direito)

## Passo 1.2: Escolher Tipo de Conta

1. Na tela que abrir, escolha: **"Quero vender"**
2. Em seguida, escolha uma das opções:
   - **MEI** (se você tem CNPJ de MEI)
   - **Pessoa Jurídica** (se tem CNPJ normal)
   - **Pessoa Física** (se não tem CNPJ - mas o nome será seu CPF)

⚠️ **IMPORTANTE**: Com conta empresarial (MEI ou PJ), o cliente verá "SubtleAI" no PIX. Com conta pessoal, verá seu nome.

## Passo 1.3: Preencher Cadastro

### Se escolheu MEI/Pessoa Jurídica:
1. **CNPJ**: Digite seu CNPJ
2. **Razão Social**: Nome da empresa no CNPJ
3. **Nome Fantasia**: **SubtleAI** (IMPORTANTE!)
4. **Email**: Seu email empresarial
5. **Telefone**: Seu telefone com DDD
6. **Senha**: Crie uma senha forte

### Se escolheu Pessoa Física:
1. **CPF**: Seu CPF
2. **Nome Completo**: Seu nome
3. **Email**: Seu email
4. **Telefone**: Seu telefone com DDD
5. **Senha**: Crie uma senha forte

## Passo 1.4: Confirmar Email

1. Vá no seu email
2. Procure email do MercadoPago
3. Clique no link de confirmação
4. Volta pro site do MercadoPago

## Passo 1.5: Completar Perfil da Empresa

1. Após confirmar email, faça login
2. Vá em **"Seu negócio"** no menu
3. Clique em **"Dados do negócio"**
4. Preencha:
   - **Categoria**: Tecnologia e Software
   - **Subcategoria**: Software/SaaS
   - **Site**: https://seu-site.vercel.app
   - **Descrição**: Transcrição e tradução de vídeos com IA

---

# PARTE 2: CONFIGURAR NOME QUE APARECE NO PIX

## Passo 2.1: Acessar Configurações de Pagamento

1. No painel do MercadoPago
2. Vá em **"Configurações"** → **"Configurações de negócio"**
3. Procure **"Nome no extrato"**

## Passo 2.2: Definir Nome para PIX

1. Em **"Nome fantasia para recebimentos"**: 
   - Digite: **SubtleAI**
2. Em **"Descrição nos extratos"**:
   - Digite: **SubtleAI - Transcrição**
3. Clique em **"Salvar"**

⚠️ **TESTE**: Peça pra alguém fazer um PIX de R$ 1,00 pra confirmar que aparece "SubtleAI"

---

# PARTE 3: OBTER CREDENCIAIS DE PRODUÇÃO

## Passo 3.1: Acessar Painel de Desenvolvedores

1. Acesse: **https://www.mercadopago.com.br/developers/panel**
2. Faça login com sua conta criada

## Passo 3.2: Criar Aplicação

1. Clique em **"Criar aplicação"**
2. Preencha:
   - **Nome**: SubtleAI Produção
   - **Descrição**: Sistema de pagamento SubtleAI
3. Marque: ✅ **"Pagamentos online"**
4. Clique em **"Criar aplicação"**

## Passo 3.3: Copiar Credenciais de PRODUÇÃO

⚠️ **SUPER IMPORTANTE**: Você verá duas abas: "Credenciais de teste" e "Credenciais de produção"

1. Clique na aba **"Credenciais de produção"**
2. Você verá:
   - **Public Key**: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   - **Access Token**: APP_USR-xxxxxx...xxx (bem longo)

3. **COPIE E GUARDE EM LUGAR SEGURO!**

📝 **Cole aqui temporariamente**:
```
Public Key: 
Access Token: 
```

---

# PARTE 4: CONFIGURAR WEBHOOK (CONFIRMAÇÃO AUTOMÁTICA)

## Passo 4.1: Acessar Configuração de Webhooks

1. Ainda no painel de desenvolvedores
2. No menu lateral, clique em **"Webhooks"**
3. Clique em **"Criar webhook"**

## Passo 4.2: Configurar URL do Webhook

1. Em **"URL de produção"**, digite:
```
https://SEU-SITE.vercel.app/api/payment/mercadopago/webhook
```

⚠️ **TROQUE "SEU-SITE" pelo seu domínio real!**

Exemplo:
- Se seu site é: subtleai.vercel.app
- A URL será: https://subtleai.vercel.app/api/payment/mercadopago/webhook

## Passo 4.3: Selecionar Eventos

Marque APENAS estes dois:
- ✅ **payment**
- ✅ **payment.created**
- ✅ **payment.updated**

NÃO marque outros!

## Passo 4.4: Gerar Assinatura Secreta

1. Clique em **"Gerar assinatura"**
2. Uma senha aparecerá tipo: `wh_secret_xxxxxxxxxxxxx`
3. **COPIE ESSA SENHA!** (super importante)

📝 **Cole aqui temporariamente**:
```
Webhook Secret: 
```

## Passo 4.5: Salvar Webhook

1. Clique em **"Criar webhook"**
2. Pronto! Webhook configurado

---

# PARTE 5: CONFIGURAR NO SEU PROJETO

## Passo 5.1: Abrir arquivo .env.local

1. No seu projeto SubtleAI
2. Abra o arquivo `.env.local`
3. Se não existir, crie um arquivo `.env.local` na raiz

## Passo 5.2: Adicionar as Credenciais

Cole no final do arquivo `.env.local`:

```env
# ===== MERCADOPAGO PRODUÇÃO =====
# Copie do Passo 3.3
MERCADOPAGO_ACCESS_TOKEN=APP_USR-[COLE O ACCESS TOKEN AQUI]
MERCADOPAGO_PUBLIC_KEY=APP_USR-[COLE A PUBLIC KEY AQUI]

# Copie do Passo 4.4
MERCADOPAGO_WEBHOOK_SECRET=[COLE O WEBHOOK SECRET AQUI]

# Configurações extras (não mude)
NEXTAUTH_URL=https://SEU-SITE.vercel.app
ADMIN_EMAIL=seu-email@gmail.com
ADMIN_SECRET=uma-senha-secreta-qualquer-123
```

⚠️ **IMPORTANTE**: 
- Substitua `[COLE...]` pelos valores reais
- Substitua `SEU-SITE` pelo seu domínio
- Substitua `seu-email@gmail.com` pelo seu email real

## Passo 5.3: Exemplo Preenchido

Seu `.env.local` deve ficar assim (com SEUS valores):

```env
# ===== MERCADOPAGO PRODUÇÃO =====
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456-012345-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-12345678-1234-1234-1234-123456789012

MERCADOPAGO_WEBHOOK_SECRET=wh_secret_a1b2c3d4e5f6g7h8

NEXTAUTH_URL=https://subtleai.vercel.app
ADMIN_EMAIL=joao@gmail.com
ADMIN_SECRET=senha-super-secreta-2024
```

---

# PARTE 6: FAZER DEPLOY NO VERCEL

## Passo 6.1: Commitar Mudanças

No terminal:
```bash
git add .
git commit -m "Add MercadoPago credentials"
git push origin main
```

## Passo 6.2: Adicionar Variáveis no Vercel

1. Acesse: **https://vercel.com**
2. Entre no seu projeto
3. Vá em **"Settings"** → **"Environment Variables"**
4. Adicione CADA variável:

Clique em **"Add New"** para cada uma:

| Key | Value |
|-----|-------|
| MERCADOPAGO_ACCESS_TOKEN | [cole o access token] |
| MERCADOPAGO_PUBLIC_KEY | [cole a public key] |
| MERCADOPAGO_WEBHOOK_SECRET | [cole o webhook secret] |

5. Clique em **"Save"** para cada uma

## Passo 6.3: Fazer Redeploy

1. Ainda no Vercel
2. Vá em **"Deployments"**
3. Nos três pontinhos do deploy mais recente
4. Clique em **"Redeploy"**
5. Confirme **"Redeploy"**
6. Aguarde 2-3 minutos

---

# PARTE 7: TESTAR PAGAMENTO

## Passo 7.1: Teste com Valor Pequeno

1. Acesse seu site: https://seu-site.vercel.app
2. Faça login com uma conta teste
3. Vá em **Pricing**
4. Escolha qualquer plano
5. Clique em **"Adquirir"**

## Passo 7.2: Verificar Redirecionamento

1. Você deve ser redirecionado pro MercadoPago
2. Deve aparecer opções:
   - PIX
   - Cartão de crédito
   - Boleto

## Passo 7.3: Testar PIX

1. Escolha **PIX**
2. Use seu CPF real
3. Faça um PIX de teste (pode ser R$ 1,00)
4. Confirme no seu banco que aparece **"SubtleAI"**

## Passo 7.4: Verificar Confirmação Automática

1. Após pagar, aguarde 10-30 segundos
2. Você deve ser redirecionado de volta pro site
3. O plano deve estar ativo automaticamente!

---

# PARTE 8: MONITORAR PAGAMENTOS

## Passo 8.1: Ver Pagamentos Recebidos

1. Acesse: **https://www.mercadopago.com.br/home**
2. Você verá todos pagamentos recebidos
3. Status deve ser **"Aprovado"**

## Passo 8.2: Ver Logs do Webhook

No Vercel:
1. Vá em **"Functions"**
2. Procure: `api/payment/mercadopago/webhook`
3. Clique em **"Logs"**
4. Você verá quando webhooks são recebidos

## Passo 8.3: Testar Webhook Manual

Para testar se webhook funciona:
1. No painel MercadoPago Developers
2. Vá em **"Webhooks"**
3. Clique no webhook criado
4. Clique em **"Enviar teste"**
5. Escolha evento **"payment"**
6. Clique em **"Enviar"**
7. Verifique nos logs do Vercel se recebeu

---

# TROUBLESHOOTING (PROBLEMAS COMUNS)

## ❌ Problema: "Nome não aparece como SubtleAI no PIX"

**Solução**:
1. Vá em Configurações → Dados do negócio
2. Verifique "Nome fantasia"
3. Aguarde 24h para propagar
4. Se persistir, contate suporte MercadoPago

## ❌ Problema: "Webhook não está funcionando"

**Solução**:
1. Verifique se a URL está correta (com https://)
2. Confirme que MERCADOPAGO_WEBHOOK_SECRET está no Vercel
3. Faça redeploy
4. Teste com "Enviar teste" no painel

## ❌ Problema: "PIX não aparece como opção"

**Solução**:
1. Confirme que conta está verificada
2. Vá em Configurações → Meios de pagamento
3. Ative PIX se estiver desativado
4. Aguarde 1 hora

## ❌ Problema: "Access Token inválido"

**Solução**:
1. Confirme que copiou da aba "Produção" (não teste)
2. Verifique se não tem espaços extras
3. Gere novo token se necessário

---

# CHECKLIST FINAL

Marque cada item conforme completar:

- [ ] Conta MercadoPago criada
- [ ] Tipo de conta: MEI/PJ/PF escolhido
- [ ] Email confirmado
- [ ] Nome fantasia "SubtleAI" configurado
- [ ] Aplicação criada no painel developers
- [ ] Public Key copiada
- [ ] Access Token copiado
- [ ] Webhook criado
- [ ] Webhook secret copiado
- [ ] .env.local atualizado
- [ ] Variáveis adicionadas no Vercel
- [ ] Deploy feito
- [ ] PIX testado com R$ 1
- [ ] Nome "SubtleAI" aparecendo no banco
- [ ] Confirmação automática funcionando

---

# SUPORTE

## MercadoPago
- Chat: No painel, ícone de chat no canto
- Telefone: 0800 775 0870
- Email: developers@mercadopago.com

## Dúvidas do Código
- Revisar arquivo: `MERCADOPAGO_PIX_AUTOMATICO.md`
- Ver logs em: Vercel → Functions → Logs

---

# 🎉 PRONTO!

Quando todos os passos estiverem completos, você terá:
- ✅ PIX automático funcionando
- ✅ Nome "SubtleAI" aparecendo pros clientes
- ✅ Confirmação instantânea sem intervenção manual
- ✅ Sistema profissional de pagamentos

**IMPORTANTE**: Guarde este documento! Você pode precisar consultar no futuro.