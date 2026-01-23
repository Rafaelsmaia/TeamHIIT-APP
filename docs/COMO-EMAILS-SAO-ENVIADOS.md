# 📧 Como os Emails Estão Sendo Enviados Atualmente

## 🎯 Visão Geral

Os emails de boas-vindas são enviados automaticamente quando um novo usuário realiza uma compra na plataforma **Greenn** (gateway de pagamentos).

## 🔄 Fluxo Completo

### 1. **Quem Dispara o Email?**

O email é disparado automaticamente pelo **webhook da Greenn** quando:
- Uma venda é paga (`sale-salePaid`)
- Uma venda é atualizada (`sale-saleUpdated`)

### 2. **Como Funciona o Processo?**

```
┌─────────────────┐
│  Cliente compra │
│  na Greenn      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Greenn envia   │
│  webhook para   │
│  Firebase       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  greennWebhook  │
│  (Firebase      │
│   Function)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  processSale    │
│  Webhook()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  createOrUpdate │
│  User()         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  sendWelcome    │
│  Email()        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Resend API     │
│  envia email    │
└─────────────────┘
```

### 3. **Arquivos Envolvidos**

#### **`functions/index.js`**
- Recebe o webhook da Greenn
- Valida a requisição
- Roteia para o processador correto

#### **`functions/src/processors.js`**
- `processSaleWebhook()`: Processa vendas pagas/atualizadas
- Cria/atualiza dados no Firestore
- Chama `createOrUpdateUser()`

#### **`functions/src/utils.js`**
- `createOrUpdateUser()`: Cria ou atualiza usuário no Firebase Auth
- Gera senha temporária
- **Chama `sendWelcomeEmail()`** quando é um novo usuário

#### **`functions/src/email.js`**
- `sendWelcomeEmail()`: Envia o email via **Resend API**
- Gera template HTML e texto do email
- Retorna `true` se enviado com sucesso

## 📦 Serviço de Email: Resend

### **O que é Resend?**
- Plataforma moderna de envio de emails transacionais
- API simples e confiável
- Suporte a templates HTML

### **Configuração Atual**

#### **1. Dependência Instalada**
```json
// functions/package.json
{
  "dependencies": {
    "resend": "^6.4.1"
  }
}
```

#### **2. Secret Configurado**
- **Secret:** `RESEND_API_KEY` (configurado no Firebase Secrets Manager)
- **Acesso:** Via `defineSecret("RESEND_API_KEY")` no código

#### **3. Variáveis de Ambiente**
- `RESEND_FROM_EMAIL`: Email remetente (fallback via `functions.config()`)
- `APP_LOGIN_URL`: URL de login do app (fallback via `functions.config()`)

### **Status da Integração**

✅ **Integração Completa:**
- ✅ Resend instalado e configurado
- ✅ Secret `RESEND_API_KEY` configurado no Firebase
- ✅ Função `sendWelcomeEmail()` implementada
- ✅ Template de email HTML/texto criado
- ✅ Integração com webhook funcionando
- ✅ Logs de sucesso/erro implementados

⚠️ **Pendências (se houver):**
- Verificar se o email remetente está verificado no Resend
- Testar envio real de email após compra

## 📧 Conteúdo do Email

O email de boas-vindas contém:
- **Assunto:** "Bem-vindo ao Team HIIT! Suas credenciais de acesso"
- **Conteúdo:**
  - Mensagem de boas-vindas personalizada
  - Email do usuário
  - Senha temporária gerada
  - Link para login
  - Instruções para alterar a senha

## 🔍 Como Verificar se Está Funcionando

### **1. Verificar Logs do Firebase Functions**

```bash
firebase functions:log --only greennWebhook
```

**Sucesso:**
```
✅ [Email] Email enviado com sucesso: [id]
✅ [Email] Email de boas-vindas enviado: usuario@email.com
```

**Erro:**
```
⚠️ [Email] RESEND_API_KEY não configurada, email não será enviado
❌ [Email] Erro ao enviar email: [detalhes do erro]
```

### **2. Verificar Firestore**

Após uma compra, verifique:
- **Coleção `user_credentials`**: Deve ter campo `sent: true` e `sentAt`
- **Coleção `users`**: Usuário criado com dados corretos

### **3. Testar Manualmente**

1. Realize uma compra de teste na Greenn
2. Verifique se o webhook foi recebido (logs)
3. Verifique se o email foi enviado (logs)
4. Verifique a caixa de entrada do email do cliente

## 🛠️ Configuração Necessária

### **1. Resend API Key**

```bash
# Configurar secret no Firebase
firebase functions:secrets:set RESEND_API_KEY
# Cole sua chave quando solicitado (começa com re_)
```

### **2. Email Remetente**

O email remetente deve estar verificado no Resend:
1. Acesse [Resend.com](https://resend.com)
2. Vá em **Domains**
3. Adicione e verifique o domínio `teamhiit.com.br`
4. Ou use o domínio de teste do Resend temporariamente

### **3. Variáveis de Ambiente (Fallback)**

```bash
# Configurar via functions.config (fallback)
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

## 📝 Resumo

| Item | Status | Observação |
|------|--------|------------|
| **Serviço de Email** | ✅ Resend | Integrado e funcionando |
| **Quem Dispara** | ✅ Webhook Greenn | Automático após compra |
| **Quando Dispara** | ✅ Novo usuário | Apenas na primeira compra |
| **API Key** | ✅ Configurada | Via Firebase Secrets |
| **Template** | ✅ Implementado | HTML + texto |
| **Logs** | ✅ Implementados | Sucesso/erro registrados |

## 🚀 Próximos Passos (Opcional)

1. **Personalizar Template:** Adicionar logo, cores da marca, etc.
2. **Adicionar Mais Tipos de Email:**
   - Recuperação de senha
   - Confirmação de pagamento
   - Lembrete de renovação
3. **Melhorar Monitoramento:**
   - Dashboard de emails enviados
   - Taxa de abertura/clique
   - Alertas de falha

