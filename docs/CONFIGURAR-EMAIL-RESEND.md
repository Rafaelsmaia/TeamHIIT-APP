# 📧 Como Configurar o Envio de Emails (Resend)

## ❌ Problema Atual

O email não está sendo enviado porque as variáveis de ambiente não estão configuradas corretamente no Firebase Functions v2.

**Erro nos logs:**
```
⚠️ [Email] RESEND_API_KEY não configurada, email não será enviado
```

## ✅ Solução: Configurar Variáveis de Ambiente

No Firebase Functions v2, as variáveis de ambiente precisam ser configuradas de forma diferente do método antigo (`functions.config()`).

### **Opção 1: Via Firebase Console (Recomendado)**

1. Acesse: https://console.firebase.google.com/project/comunidade-team-hiit/functions
2. Clique na função `greennWebhook`
3. Vá na aba **"Configuration"** ou **"Environment variables"**
4. Adicione as seguintes variáveis:

   - **Nome:** `RESEND_API_KEY`
   - **Valor:** `re_Hxg6wmLV_EavGLhtS5cMdQfxyvEb8pHX5` (sua chave do Resend)

   - **Nome:** `RESEND_FROM_EMAIL`
   - **Valor:** `noreply@teamhiit.com.br`

   - **Nome:** `APP_LOGIN_URL`
   - **Valor:** `https://app.teamhiit.com.br/login`

5. Clique em **"Save"** ou **"Deploy"**

### **Opção 2: Via Firebase CLI (Secrets - Mais Seguro)**

Para informações sensíveis como API keys, use secrets:

```bash
# Configurar secrets (mais seguro)
echo "re_Hxg6wmLV_EavGLhtS5cMdQfxyvEb8pHX5" | firebase functions:secrets:set RESEND_API_KEY

# Configurar variáveis de ambiente normais
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

**Nota:** Se usar secrets, você precisará atualizar o código para acessá-los.

### **Opção 3: Atualizar o Código para Usar Secrets**

Se preferir usar secrets (mais seguro), atualize o código:

```javascript
// functions/src/email.js
const { defineSecret } = require("firebase-functions/params");

const resendApiKey = defineSecret("RESEND_API_KEY");

// Depois, na função:
const apiKey = resendApiKey.value();
```

E no `index.js`, adicione os secrets:

```javascript
exports.greennWebhook = onRequest({
  secrets: [resendApiKey],
  // ... resto da configuração
}, async (req, res) => {
  // ...
});
```

## 🔍 Verificar se Está Funcionando

Após configurar, envie um novo teste de venda e verifique os logs:

```bash
firebase functions:log --only greennWebhook
```

Você deve ver:
```
✅ [Email] Email enviado com sucesso: [id]
```

Ao invés de:
```
⚠️ [Email] RESEND_API_KEY não configurada
```

## 📝 Checklist

- [ ] Variável `RESEND_API_KEY` configurada
- [ ] Variável `RESEND_FROM_EMAIL` configurada
- [ ] Variável `APP_LOGIN_URL` configurada
- [ ] Email remetente verificado no Resend
- [ ] Teste enviado e email recebido

