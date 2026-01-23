# 📧 Como Enviar Email Manualmente

Este guia explica como usar o script `send-email-manually.js` para enviar emails de boas-vindas manualmente, simulando uma compra.

## 📋 Pré-requisitos

1. **Firebase Admin SDK configurado** (uma das opções abaixo):
   - Arquivo `serviceAccount.json` na pasta `functions/`
   - Ou variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` apontando para o arquivo de credenciais
   - Ou executar `gcloud auth application-default login`

2. **Variáveis de ambiente configuradas**:
   - `RESEND_API_KEY` - Chave da API do Resend
   - `RESEND_FROM_EMAIL` - Email remetente (opcional, padrão: noreply@teamhiit.com.br)
   - `APP_LOGIN_URL` - URL base do app (opcional, padrão: https://app.teamhiit.com.br)

## 🔧 Configuração

### 1. Instalar dependências

```bash
cd functions
npm install
```

### 2. Criar arquivo `.env` (opcional)

Na pasta `functions`, crie um arquivo `.env`:

```env
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
APP_LOGIN_URL=https://app.teamhiit.com.br
```

**Ou** configure como variáveis de ambiente do sistema.

### 3. Configurar credenciais do Firebase

**Opção A: Arquivo serviceAccount.json**

1. Baixe o arquivo de credenciais do Firebase Console:
   - Acesse [Firebase Console](https://console.firebase.google.com)
   - Vá em **Project Settings** > **Service Accounts**
   - Clique em **Generate New Private Key**
   - Salve como `serviceAccount.json` na pasta `functions/`

**Opção B: Variável de ambiente**

```bash
# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\para\serviceAccount.json"

# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/serviceAccount.json"
```

**Opção C: gcloud CLI**

```bash
gcloud auth application-default login
```

## 🚀 Como Usar

### Uso básico:

```bash
cd functions
node send-email-manually.js <email> <nome>
```

### Exemplo:

```bash
node send-email-manually.js usuario@exemplo.com "João Silva"
```

### Usando o script npm:

```bash
npm run send-email -- usuario@exemplo.com "João Silva"
```

## 📝 O que o script faz:

1. ✅ Valida os argumentos (email e nome)
2. ✅ Inicializa o Firebase Admin SDK
3. ✅ Cria um novo usuário no Firebase Authentication (se não existir)
4. ✅ Gera uma senha temporária
5. ✅ Salva credenciais no Firestore (`user_credentials`)
6. ✅ Cria registro no Firestore (`users`)
7. ✅ Envia email de boas-vindas com:
   - Email de acesso
   - Senha temporária
   - Botão "Login Automático"
8. ✅ Marca o email como enviado

## ⚠️ Observações

- **Usuários existentes**: Se o email já estiver cadastrado, o script não enviará email (apenas informará que o usuário já existe)
- **Senha temporária**: A senha é gerada automaticamente e exibida no console
- **Token de login automático**: O link no email permite login automático sem digitar senha
- **Validade do token**: O token de login automático expira em 24 horas

## 🔍 Verificar se funcionou

1. **Firebase Authentication**: Verifique se o usuário foi criado
2. **Firestore**:
   - Coleção `users`: Deve ter um documento com o UID do usuário
   - Coleção `user_credentials`: Deve ter um documento com email e senha temporária
3. **Email**: Verifique a caixa de entrada do email informado

## ❌ Solução de Problemas

### Erro: "RESEND_API_KEY não configurada"
- Verifique se o arquivo `.env` existe e contém `RESEND_API_KEY`
- Ou configure como variável de ambiente

### Erro: "Firebase Admin não inicializado"
- Verifique se `serviceAccount.json` existe na pasta `functions/`
- Ou configure `GOOGLE_APPLICATION_CREDENTIALS`
- Ou execute `gcloud auth application-default login`

### Erro: "Email inválido"
- Verifique se o email está no formato correto (exemplo@dominio.com)

### Email não foi enviado
- Verifique os logs do console
- Verifique se a chave do Resend está correta
- Verifique se o email remetente está configurado no Resend

## 📚 Arquivos Relacionados

- `functions/send-email-manually.js` - Script principal
- `functions/src/utils.js` - Função `createOrUpdateUser`
- `functions/src/email.js` - Função `sendWelcomeEmail`
- `functions/.env` - Variáveis de ambiente (criar manualmente)

