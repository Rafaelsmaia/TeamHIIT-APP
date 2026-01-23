# 📧 Guia de Migração de Usuários Antigos

Este guia explica como migrar usuários do Team HIIT antigo para a nova plataforma PWA.

## 🎯 O que o script faz?

1. Lê uma planilha CSV com dados dos usuários antigos
2. Cria contas no Firebase Authentication
3. Define como assinantes com acesso completo
4. Gera senhas aleatórias e seguras
5. Envia emails com credenciais de acesso

## 📋 Pré-requisitos

1. Ter o arquivo `serviceAccountKey.json` na pasta `functions/`
2. Ter os pacotes instalados: `npm install csv-parser`
3. Ter a planilha exportada como CSV

## 📊 Formato da Planilha (CSV)

O CSV deve ter as seguintes colunas (podem ter outras, o script vai ignorar):

```csv
Código,Produto,Cpf,Nome,E-mail,Endereço,Telefone,Visto Por Último,Status da Negociação
13796680,Team HIIT,023.707.260-24,João Silva,joao@exemplo.com,Sem endereço,5,5E+12,30/11/2024 18:08:30
```

### Colunas utilizadas (case-insensitive):
- **Email** (obrigatório): `E-mail`, `Email`, `email`
- **Nome**: `Nome`, `Name`, `name`
- **CPF**: `Cpf`, `CPF`, `cpf`
- **Telefone**: `Telefone`, `Phone`, `phone`
- **Código**: `Código`, `Codigo`, `codigo`

**⚠️ Linhas sem email serão puladas automaticamente.**

## 🚀 Como usar

### 1. Exportar planilha como CSV

#### No Excel Online (como sua planilha):
1. Abra a planilha no Excel Online
2. Clique em **Arquivo** → **Salvar Como** → **Baixar uma Cópia**
3. Escolha o formato **CSV (delimitado por vírgulas) (*.csv)**
4. Salve o arquivo na pasta `functions/` com o nome `users.csv`

#### No Google Sheets:
- Arquivo → Baixar → Valores separados por vírgula (.csv)

### 2. Instalar dependência (se ainda não tiver)

```bash
cd functions
npm install csv-parser
```

### 3. Executar o script

```bash
node migrate-users.js users.csv
```

Ou se o arquivo estiver em outro lugar:

```bash
node migrate-users.js C:\caminho\para\planilha.csv
```

## 📊 O que acontece durante a execução?

O script vai:
1. ✅ Criar usuário no Firebase Auth (se não existir)
2. ✅ Salvar credenciais no Firestore
3. ✅ Criar perfil com `isSubscriber: true` e `hasCalorieCalculator: true`
4. ✅ Enviar email com login e senha
5. ✅ Marcar como enviado no Firestore

### Exemplo de saída:

```
🚀 Iniciando migração de usuários de: users.csv

📊 Total de usuários para migrar: 150

📧 Processando: joao@exemplo.com (João Silva)
✅ Usuário criado: abc123xyz
✅ Credenciais salvas
✅ Perfil criado/atualizado no Firestore
✅ Email enviado com sucesso!

📧 Processando: maria@exemplo.com (Maria Santos)
✅ Usuário já existe: def456uvw
ℹ️ Email já foi enviado anteriormente

...

=== RESUMO DA MIGRAÇÃO ===
✅ Emails enviados com sucesso: 148
ℹ️ Emails já enviados anteriormente: 2
❌ Falhas: 0

✅ Migração concluída!
```

## ⚠️ Importante

- O script processa **1 usuário por segundo** para evitar rate limits
- Se um usuário já existe, o script não recria, apenas atualiza o perfil
- Se um email já foi enviado, o script pula o reenvio
- Todas as senhas são geradas automaticamente e enviadas por email
- Os usuários migrados terão acesso completo à plataforma

## 🔍 Verificar resultados

Após a migração, você pode verificar:

1. **Firebase Authentication**: Console Firebase → Authentication → Users
2. **Firestore - users**: Verificar se `isSubscriber: true`
3. **Firestore - user_credentials**: Verificar se `sent: true`

## ❌ Em caso de erro

Se algum email falhar:
- O script vai continuar com os próximos
- No final, mostra a lista de falhas
- Você pode reenviar manualmente com `node resend-email.js <email>`

## 📝 Exemplo de CSV completo

Veja o arquivo `users-example.csv` para um exemplo de formato.
