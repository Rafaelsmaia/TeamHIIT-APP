# Como Configurar Variáveis de Ambiente

O Firebase está migrando do `functions:config` para variáveis de ambiente. Vou mostrar **ambas as formas**:

## ⚠️ IMPORTANTE: Migração do Firebase

O Firebase está depreciando `functions:config` (vai parar de funcionar em Março 2026). A forma **recomendada** agora é usar variáveis de ambiente.

## Método 1: Variáveis de Ambiente (RECOMENDADO) ✅

### Passo 1: Criar arquivo `.env`

Na pasta `functions`, crie um arquivo `.env`:

```bash
cd functions
copy .env.example .env
```

Ou crie manualmente o arquivo `functions/.env` com:

```env
RESEND_API_KEY=re_SUA_CHAVE_AQUI
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
APP_LOGIN_URL=https://app.teamhiit.com.br/login
```

### Passo 2: Configurar no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `comunidade-team-hiit`
3. Vá em **Functions** > **Config**
4. Clique em **Add variable** para cada variável:
   - `RESEND_API_KEY` = `re_SUA_CHAVE_AQUI`
   - `RESEND_FROM_EMAIL` = `noreply@teamhiit.com.br`
   - `APP_LOGIN_URL` = `https://app.teamhiit.com.br/login`

### Passo 3: Configurar via CLI (Alternativa)

```bash
firebase functions:secrets:set RESEND_API_KEY
# Cole sua chave quando solicitado

firebase functions:secrets:set RESEND_FROM_EMAIL
# Cole o email quando solicitado

firebase functions:secrets:set APP_LOGIN_URL
# Cole a URL quando solicitado
```

## Método 2: functions:config (LEGADO - Funciona até Março 2026)

Se preferir usar o método antigo (ainda funciona):

```bash
firebase functions:config:set resend.api_key="re_SUA_CHAVE_AQUI"
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

## Como Obter a API Key do Resend

1. Acesse [Resend.com](https://resend.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Clique em **Create API Key**
5. Copie a chave (começa com `re_`)
6. Use no passo acima

## Verificar Configurações

### Ver variáveis de ambiente (secrets):
```bash
firebase functions:secrets:access
```

### Ver config antigo (se usou):
```bash
firebase functions:config:get
```

## Próximo Passo

Após configurar as variáveis, faça o deploy:

```bash
firebase deploy --only functions
```
















