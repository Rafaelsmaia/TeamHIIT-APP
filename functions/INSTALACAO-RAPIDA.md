# Guia Rápido de Instalação - Webhook Greenn

## 1. Instalar Dependências

```bash
cd functions
npm install
```

## 2. Configurar Variáveis de Ambiente no Firebase

### Opção A: Via Firebase CLI

```bash
firebase functions:config:set resend.api_key="re_SUA_CHAVE_AQUI"
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

### Opção B: Via Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `comunidade-team-hiit`
3. Vá em **Functions** > **Config**
4. Adicione as variáveis:
   - `resend.api_key` = `re_SUA_CHAVE_AQUI`
   - `resend.from_email` = `noreply@teamhiit.com.br`
   - `app.login_url` = `https://app.teamhiit.com.br/login`

## 3. Obter API Key do Resend

1. Acesse [Resend.com](https://resend.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Crie uma nova chave (começa com `re_`)
5. Copie a chave e use no passo 2

## 4. Verificar Email Remetente no Resend

1. No Resend, vá em **Domains**
2. Adicione seu domínio (ex: `teamhiit.com.br`)
3. Verifique o DNS conforme instruções
4. Ou use o domínio de teste do Resend temporariamente

## 5. Deploy das Functions

```bash
# Na raiz do projeto
firebase deploy --only functions
```

## 6. URL do Webhook

Após o deploy, a URL será:

```
https://us-central1-comunidade-team-hiit.cloudfunctions.net/greennWebhook
```

Configure esta URL na plataforma Greenn.

## 7. Testar Health Check

```bash
curl https://us-central1-comunidade-team-hiit.cloudfunctions.net/greennWebhook/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "greenn-webhook",
  "uptime": ...
}
```

## 8. Testar Webhook Localmente (Opcional)

```bash
# Instalar Firebase Emulators
npm install -g firebase-tools

# Iniciar emuladores
firebase emulators:start --only functions

# Testar em outro terminal
curl -X POST http://localhost:5001/comunidade-team-hiit/us-central1/greennWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "event": "saleUpdated",
    "currentStatus": "paid",
    "product": {
      "type": "SUBSCRIPTION"
    },
    "client": {
      "email": "teste@example.com",
      "name": "Teste"
    }
  }'
```

## Troubleshooting

### Erro: "RESEND_API_KEY não configurada"
- Verifique se configurou as variáveis no Firebase (passo 2)
- Após configurar, faça deploy novamente: `firebase deploy --only functions`

### Erro: "Email não enviado"
- Verifique se o email remetente está verificado no Resend
- Verifique se a API key está correta
- Veja os logs: `firebase functions:log`

### Erro: "Usuário não criado"
- Verifique se o email do cliente está presente no payload
- Veja os logs: `firebase functions:log --only greennWebhook`

### Ver Logs

```bash
# Todos os logs
firebase functions:log

# Logs de uma função específica
firebase functions:log --only greennWebhook

# Logs em tempo real
firebase functions:log --tail
```

## Próximos Passos

1. ✅ Configurar webhook na plataforma Greenn
2. ✅ Testar com compra real de teste
3. ✅ Verificar criação de usuários no Firebase Auth
4. ✅ Verificar envio de emails
5. ✅ Verificar dados no Firestore
6. ✅ Monitorar logs do Firebase Functions
















