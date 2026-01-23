# 🧪 Como Testar o Envio Manual de Email

Guia passo a passo para testar o script de envio manual de email.

## 📋 Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
cd functions
npm install
```

Isso instalará a dependência `dotenv` que é necessária para ler o arquivo `.env`.

---

## 📝 Passo 2: Criar Arquivo `.env`

Na pasta `functions`, crie um arquivo chamado `.env` (sem extensão) com o seguinte conteúdo:

```env
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
APP_LOGIN_URL=https://app.teamhiit.com.br
```

**Onde encontrar a chave do Resend:**
1. Acesse [resend.com](https://resend.com)
2. Faça login
3. Vá em **API Keys**
4. Copie uma chave existente ou crie uma nova
5. Cole no lugar de `re_sua_chave_aqui`

---

## 🔑 Passo 3: Configurar Credenciais do Firebase

Você precisa de um arquivo de credenciais do Firebase. Escolha **UMA** das opções:

### Opção A: Usar o arquivo existente (mais fácil)

Se você já tem o arquivo `serviceAccountKey.json` na raiz do projeto:

1. Copie o arquivo para a pasta `functions`:
   ```bash
   # No PowerShell (Windows)
   copy ..\serviceAccountKey.json functions\serviceAccount.json
   ```

2. Ou renomeie para `serviceAccount.json` dentro da pasta `functions`

### Opção B: Baixar novo arquivo do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **⚙️ Configurações do Projeto** > **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Salve o arquivo como `serviceAccount.json` na pasta `functions/`

---

## 🚀 Passo 4: Executar o Teste

Agora você pode testar! Execute no terminal:

```bash
cd functions
node send-email-manually.js seu-email@exemplo.com "Seu Nome"
```

**Exemplo real:**
```bash
node send-email-manually.js teste@teamhiit.com.br "João Silva"
```

**Ou usando o script npm:**
```bash
npm run send-email -- teste@teamhiit.com.br "João Silva"
```

---

## ✅ O que deve acontecer:

Se tudo estiver correto, você verá algo assim:

```
✅ Firebase Admin inicializado via serviceAccount.json
📧 Iniciando envio manual de email...
   Email: teste@teamhiit.com.br
   Nome: João Silva

👤 Criando/atualizando usuário...
🆕 [User] Criando novo usuário: teste@teamhiit.com.br
✅ [User] Usuário criado: abc123xyz
✅ Usuário criado com sucesso!
   User ID: abc123xyz
   Senha temporária: XyZ123AbC456

📨 Enviando email de boas-vindas...
✅ [Email] Email de boas-vindas enviado: teste@teamhiit.com.br
✅ Email enviado com sucesso!

📋 Resumo:
   Email: teste@teamhiit.com.br
   Nome: João Silva
   User ID: abc123xyz
   Senha temporária: XyZ123AbC456
   URL de login automático: https://app.teamhiit.com.br/#/auto-login?token=...

✅ Processo concluído com sucesso!
```

---

## ❌ Possíveis Erros e Soluções

### Erro: "RESEND_API_KEY não configurada"
**Solução:** Verifique se o arquivo `.env` existe na pasta `functions/` e contém a chave correta.

### Erro: "Firebase Admin não inicializado"
**Solução:** 
- Verifique se `serviceAccount.json` existe na pasta `functions/`
- Ou configure a variável `GOOGLE_APPLICATION_CREDENTIALS`

### Erro: "Email inválido"
**Solução:** Verifique se o email está no formato correto (exemplo@dominio.com)

### Erro: "Usuário já existe"
**Solução:** Isso não é um erro! O script apenas informa que o usuário já está cadastrado. Use um email diferente para testar.

### Erro: "Cannot find module 'dotenv'"
**Solução:** Execute `npm install` na pasta `functions/`

---

## 🔍 Verificar se Funcionou

1. **Verifique o email**: O destinatário deve receber um email com:
   - Credenciais de acesso
   - Senha temporária
   - Botão "Login Automático"

2. **Verifique o Firebase Console**:
   - **Authentication**: Deve ter um novo usuário
   - **Firestore** > `users`: Deve ter um documento com o UID do usuário
   - **Firestore** > `user_credentials`: Deve ter um documento com email e senha

---

## 📚 Comandos Rápidos

```bash
# Ir para a pasta functions
cd functions

# Instalar dependências
npm install

# Executar teste
node send-email-manually.js email@exemplo.com "Nome"

# Ou usando npm
npm run send-email -- email@exemplo.com "Nome"
```

---

## 💡 Dica

Se você quiser testar várias vezes com o mesmo email, primeiro delete o usuário no Firebase Console (Authentication) para que o script crie um novo usuário e envie o email novamente.

