# Firebase Functions - Webhook da Greenn

Este diretório contém as Firebase Cloud Functions para processar webhooks da plataforma Greenn.

## Funcionalidades

- ✅ Processa eventos de vendas (`saleUpdated`)
- ✅ Processa eventos de contratos (`contractUpdated`)
- ✅ Processa eventos de carrinho abandonado (`checkoutAbandoned`)
- ✅ Cria usuários automaticamente no Firebase Authentication
- ✅ Envia emails de boas-vindas com credenciais
- ✅ Define claims customizados para usuários com assinatura ativa
- ✅ Salva dados no Firestore (vendas, contratos, clientes, leads)

## Configuração

### 1. Instalar dependências

```bash
cd functions
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

Variáveis necessárias:
- `RESEND_API_KEY` - API Key do Resend (começa com `re_`)
- `RESEND_FROM_EMAIL` - Email remetente (deve estar verificado no Resend)
- `APP_LOGIN_URL` - URL de login do app (ex: `https://app.teamhiit.com.br/login`)
- `GREENN_WEBHOOK_TOKEN` - Token de autenticação (se a Greenn fornecer)

### 3. Configurar variáveis no Firebase

```bash
firebase functions:config:set resend.api_key="re_xxxxxxxxxxxx"
firebase functions:config:set resend.from_email="noreply@teamhiit.com.br"
firebase functions:config:set app.login_url="https://app.teamhiit.com.br/login"
```

Ou use o Firebase Console:
1. Acesse Firebase Console > Functions > Config
2. Adicione as variáveis de ambiente

## Deploy

### Deploy completo

```bash
firebase deploy --only functions
```

### Deploy de uma função específica

```bash
firebase deploy --only functions:greennWebhook
```

### Deploy em produção

```bash
firebase deploy --only functions --project=comunidade-team-hiit
```

## Endpoints

### Webhook Principal

- **URL**: `https://us-central1-comunidade-team-hiit.cloudfunctions.net/greennWebhook`
- **Método**: `POST`
- **Content-Type**: `application/json`

### Health Check

- **URL**: `https://us-central1-comunidade-team-hiit.cloudfunctions.net/greennWebhook/health`
- **Método**: `GET`

## Testes Locais

### Usar Firebase Emulators

```bash
firebase emulators:start --only functions
```

### Testar webhook localmente

```bash
curl -X POST http://localhost:5001/comunidade-team-hiit/us-central1/greennWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "event": "saleUpdated",
    "currentStatus": "paid",
    ...
  }'
```

## Estrutura de Dados

### Coleções do Firestore

- `sales` - Vendas processadas
- `contracts` - Contratos processados
- `clients` - Clientes
- `leads` - Leads para follow-up
- `abandoned_carts` - Carrinhos abandonados
- `users` - Dados dos usuários
- `user_credentials` - Credenciais temporárias
- `webhook_errors` - Erros do webhook

## Monitoramento

### Ver logs

```bash
firebase functions:log
```

### Ver logs de uma função específica

```bash
firebase functions:log --only greennWebhook
```

### Ver logs em tempo real

```bash
firebase functions:log --tail
```

## Troubleshooting

### Erro: "RESEND_API_KEY não configurada"

Configure a variável de ambiente no Firebase:

```bash
firebase functions:config:set resend.api_key="sua_chave_aqui"
```

### Erro: "Email não enviado"

Verifique:
1. Se a chave do Resend está correta
2. Se o email remetente está verificado no Resend
3. Se o email destinatário é válido

### Erro: "Usuário não criado"

Verifique:
1. Se o Firebase Admin está configurado corretamente
2. Se as regras do Firestore permitem escrita
3. Se o email do cliente está presente no payload

## Próximos Passos

1. Configurar webhook na plataforma Greenn
2. Testar com compra real de teste
3. Verificar criação de usuários no Firebase Auth
4. Verificar envio de emails
5. Verificar dados no Firestore
6. Monitorar logs do Firebase Functions
7. Configurar alertas para erros críticos
















