# 🔍 Como Verificar se o Webhook da Greenn Funcionou

## 📋 Onde Verificar no Firebase

### 1. 📊 **Firebase Console - Firestore Database**

Acesse: https://console.firebase.google.com/project/comunidade-team-hiit/firestore

#### **Coleções para verificar:**

1. **`sales`** - Vendas processadas
   - Procure por um documento com o `saleId` da venda de teste
   - Deve conter: `status: "paid"`, `amount`, `client`, `product`

2. **`contracts`** - Contratos processados (se aplicável)
   - Procure por um documento com o `contractId`
   - Deve conter: `status: "paid"`, `startDate`, `currentPeriodEnd`

3. **`clients`** - Clientes atualizados
   - Procure pelo `clientId` ou email do cliente de teste
   - Deve conter: `name`, `email`, `cellphone`, `lastPurchase`

4. **`users`** - Usuários criados/atualizados
   - Procure pelo email do cliente de teste
   - Deve conter: `email`, `name`, `isSubscriber: true`, `subscription`

5. **`user_credentials`** - Credenciais temporárias
   - Procure pelo UID do usuário criado
   - Deve conter: `email`, `tempPassword`, `sent: true/false`

6. **`webhook_errors`** - Erros do webhook (se houver)
   - Verifique se há erros registrados

### 2. 🔐 **Firebase Console - Authentication**

Acesse: https://console.firebase.google.com/project/comunidade-team-hiit/authentication/users

#### **O que verificar:**

1. **Usuário criado**
   - Procure pelo email do cliente de teste
   - Deve existir um usuário com esse email

2. **Claims customizados**
   - Clique no usuário
   - Vá em "Custom claims"
   - Deve ter: `hasSubscription: true`, `subscriptionStatus: "active"`

### 3. 📝 **Firebase Console - Functions - Logs**

Acesse: https://console.firebase.google.com/project/comunidade-team-hiit/functions/logs

#### **O que procurar nos logs:**

1. **Logs de sucesso:**
   ```
   📥 [Webhook] Nova requisição recebida
   🛒 [Sale] Processando venda: [ID]
   ✅ [Sale] Venda salva no Firestore: [ID]
   ✅ [User] Usuário criado: [UID]
   ✅ [Email] Email de boas-vindas enviado: [email]
   ```

2. **Logs de erro:**
   ```
   ❌ [Webhook] Erro ao processar webhook: [erro]
   ⚠️ [Email] Falha ao enviar email
   ```

### 4. 📧 **Verificar Email Enviado**

- Verifique a caixa de entrada do email do cliente de teste
- Procure por: "Bem-vindo ao Team HIIT! Suas credenciais de acesso"
- Se não recebeu, verifique a pasta de spam

## 🚀 Como Verificar via Terminal

### Ver logs do webhook:

```bash
firebase functions:log --only greennWebhook
```

### Ver logs em tempo real:

```bash
firebase functions:log --tail --only greennWebhook
```

## ✅ Checklist de Verificação

Após enviar um teste de venda paga, verifique:

- [ ] **Logs do Firebase Functions** - Webhook recebeu a requisição
- [ ] **Firestore - `sales`** - Venda foi salva
- [ ] **Firestore - `clients`** - Cliente foi atualizado
- [ ] **Firestore - `users`** - Usuário foi criado/atualizado
- [ ] **Firebase Auth** - Usuário existe na autenticação
- [ ] **Firebase Auth - Claims** - Claims customizados foram definidos
- [ ] **Firestore - `user_credentials`** - Credenciais foram salvas
- [ ] **Email** - Email de boas-vindas foi enviado (verificar caixa de entrada)

## 🐛 Problemas Comuns

### ❌ Webhook não processou

**Sintomas:** Nenhum dado no Firestore, nenhum usuário criado

**Soluções:**
1. Verificar logs: `firebase functions:log --only greennWebhook`
2. Verificar se a URL do webhook está correta na Greenn
3. Verificar se o webhook está deployado: `firebase functions:list`

### ❌ Usuário não foi criado

**Sintomas:** Venda salva, mas sem usuário no Auth

**Soluções:**
1. Verificar se o email do cliente está presente no payload
2. Verificar se `status: "paid"` e `product.type: "SUBSCRIPTION"`
3. Verificar logs para erros específicos

### ❌ Email não foi enviado

**Sintomas:** Usuário criado, mas sem email

**Soluções:**
1. Verificar se `RESEND_API_KEY` está configurada
2. Verificar se `RESEND_FROM_EMAIL` está configurada
3. Verificar logs para erros do Resend
4. Verificar se o email remetente está verificado no Resend

## 📞 Próximos Passos

1. **Fazer deploy da correção:**
   ```bash
   firebase deploy --only functions:greennWebhook
   ```

2. **Enviar novo teste** da plataforma Greenn

3. **Verificar novamente** seguindo este guia

