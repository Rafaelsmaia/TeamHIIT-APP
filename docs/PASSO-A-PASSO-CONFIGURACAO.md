# Passo a Passo: Configurar Variáveis de Ambiente

## 📋 Opção 1: Via Firebase Console (MAIS FÁCIL) ✅

### Passo 1: Acesse o Firebase Console

1. Abra [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto **comunidade-team-hiit**

### Passo 2: Configure as Variáveis

1. No menu lateral, clique em **Functions**
2. Clique na aba **Config** (ou **Secrets**)
3. Clique em **Add variable** (ou **Add secret**)

### Passo 3: Adicione cada variável

Clique em **Add variable** e adicione uma por vez:

#### Variável 1: RESEND_API_KEY
- **Nome**: `RESEND_API_KEY`
- **Valor**: `re_SUA_CHAVE_AQUI` (obtenha em https://resend.com/api-keys)
- **Clique em Save**

#### Variável 2: RESEND_FROM_EMAIL
- **Nome**: `RESEND_FROM_EMAIL`
- **Valor**: `noreply@teamhiit.com.br` (ou seu email verificado no Resend)
- **Clique em Save**

#### Variável 3: APP_LOGIN_URL
- **Nome**: `APP_LOGIN_URL`
- **Valor**: `https://app.teamhiit.com.br/login` (ou a URL do seu app)
- **Clique em Save**

### Pronto! ✅

Agora você pode fazer o deploy:

```bash
firebase deploy --only functions
```

---

## 📋 Opção 2: Via Firebase CLI (TERMINAL)

### Passo 1: Obter API Key do Resend

1. Acesse [Resend.com](https://resend.com)
2. Faça login ou crie uma conta
3. Vá em **API Keys**
4. Clique em **Create API Key**
5. Copie a chave (começa com `re_`)

### Passo 2: Configurar via CLI

Abra o terminal na raiz do projeto e execute:

```bash
# Configurar RESEND_API_KEY
firebase functions:secrets:set RESEND_API_KEY
# Cole sua chave quando solicitado e pressione Enter

# Configurar RESEND_FROM_EMAIL
firebase functions:secrets:set RESEND_FROM_EMAIL
# Cole o email quando solicitado e pressione Enter

# Configurar APP_LOGIN_URL
firebase functions:secrets:set APP_LOGIN_URL
# Cole a URL quando solicitado e pressione Enter
```

### Verificar se funcionou

```bash
firebase functions:secrets:access
```

### Pronto! ✅

Agora você pode fazer o deploy:

```bash
firebase deploy --only functions
```

---

## 📋 Opção 3: Método Antigo (functions:config)

⚠️ **Nota**: Este método será descontinuado em Março 2026, mas ainda funciona.

```bash
firebase functions:config:set resend.api_key="re_SUA_CHAVE_AQUI"
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

---

## 🔍 Como Obter a API Key do Resend

1. **Acesse**: https://resend.com
2. **Faça login** ou crie uma conta
3. **Clique em "API Keys"** no menu
4. **Clique em "Create API Key"**
5. **Dê um nome** (ex: "Team HIIT Webhook")
6. **Copie a chave** (começa com `re_`)
7. **Use no passo acima**

## ✅ Verificar se está configurado

### Se usou Console ou Secrets:
```bash
firebase functions:secrets:access
```

### Se usou functions:config:
```bash
firebase functions:config:get
```

## 🚀 Próximo Passo

Após configurar, faça o deploy:

```bash
firebase deploy --only functions
```

## ❓ Problemas?

### "RESEND_API_KEY não configurada"
- Verifique se configurou no Firebase Console ou via CLI
- Após configurar, faça deploy novamente

### "Email não enviado"
- Verifique se o email remetente está verificado no Resend
- Verifique se a API key está correta
- Veja os logs: `firebase functions:log`





