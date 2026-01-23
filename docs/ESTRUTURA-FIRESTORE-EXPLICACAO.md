# 📊 Estrutura do Firestore - Explicação

## 🤔 Por que existem múltiplas coleções?

### **Situação Atual:**

1. **`clients`** - Dados do cliente na plataforma Greenn
   - ID da Greenn (`client.id`)
   - Dados de pagamento (endereço completo, CPF, etc.)
   - Última compra
   - **Propósito:** Referência aos dados da Greenn

2. **`users`** - Dados do usuário no aplicativo
   - UID do Firebase (`user.uid`)
   - Dados de uso do app (progresso, hábitos, etc.)
   - Status de assinatura
   - **Propósito:** Dados do usuário no app

3. **`sales`** - Histórico de vendas/transações
   - Cada venda é um documento separado
   - **Propósito:** Histórico de transações

4. **`contracts`** - Contratos de assinatura
   - Cada contrato é um documento separado
   - **Propósito:** Histórico de contratos

5. **`user_credentials`** - Credenciais temporárias
   - Senhas temporárias geradas
   - **Propósito:** Armazenar credenciais até o email ser enviado

## ⚠️ Problema: Duplicação de Dados

**Atualmente há duplicação:**
- `clients` tem: nome, email, telefone, endereço
- `users` tem: nome, email, telefone, endereço (mesmos dados!)

**Isso causa:**
- Dados duplicados
- Possibilidade de inconsistência
- Mais complexidade para manter

## ✅ Solução Recomendada: Simplificar

### **Estrutura Simplificada:**

1. **`users`** - Única fonte de verdade para dados do usuário
   - UID do Firebase como ID do documento
   - Dados pessoais (nome, email, telefone, endereço)
   - Dados da Greenn (clientId, greenNUserId)
   - Status de assinatura
   - Progresso no app
   - **Vantagem:** Tudo em um lugar, fácil de consultar

2. **`sales`** - Histórico de vendas (manter separado)
   - Referência ao `userId` (UID do Firebase)
   - Dados da venda
   - **Vantagem:** Histórico completo de transações

3. **`contracts`** - Histórico de contratos (manter separado)
   - Referência ao `userId` (UID do Firebase)
   - Dados do contrato
   - **Vantagem:** Histórico completo de contratos

4. **`user_credentials`** - Credenciais temporárias (manter separado)
   - Referência ao `userId` (UID do Firebase)
   - **Vantagem:** Dados temporários separados

### **Remover:**
- ❌ **`clients`** - Dados podem ser armazenados em `users`

## 🔄 Como Funcionaria:

### **Quando uma venda é paga:**

1. Salvar venda em `sales` com `userId` (referência)
2. Criar/atualizar usuário em `users` com todos os dados
3. Salvar contrato em `contracts` com `userId` (referência)

### **Consultas:**

- **Buscar dados do usuário:** `users/{uid}` (tudo em um lugar)
- **Histórico de vendas:** `sales` filtrado por `userId`
- **Histórico de contratos:** `contracts` filtrado por `userId`

## 📝 Exemplo de Estrutura Simplificada:

```javascript
// users/{uid}
{
  // Dados pessoais
  email: "joao@example.com",
  name: "João Silva",
  cellphone: "11988888888",
  cpfCnpj: "123.456.789-00",
  address: { ... },
  
  // Dados da Greenn
  greenNClientId: 888888,
  greenNUserId: "greenn_123",
  
  // Assinatura
  isSubscriber: true,
  subscription: {
    contractId: 666666,
    status: "active",
    startDate: "...",
    currentPeriodEnd: "..."
  },
  
  // Progresso no app
  progress: { ... },
  habits: { ... }
}

// sales/{saleId}
{
  saleId: 777777,
  userId: "firebase_uid_123", // Referência ao usuário
  status: "paid",
  amount: 99.90,
  // ... outros dados da venda
}

// contracts/{contractId}
{
  contractId: 666666,
  userId: "firebase_uid_123", // Referência ao usuário
  status: "paid",
  // ... outros dados do contrato
}
```

## 🎯 Benefícios da Simplificação:

1. ✅ **Menos duplicação** - Dados em um só lugar
2. ✅ **Mais simples** - Menos coleções para gerenciar
3. ✅ **Mais eficiente** - Menos consultas necessárias
4. ✅ **Mais consistente** - Uma única fonte de verdade
5. ✅ **Mais fácil de manter** - Menos código para atualizar

## 🔧 Implementação:

Para implementar essa simplificação, precisaríamos:

1. Modificar o webhook para não criar `clients` separado
2. Armazenar todos os dados em `users`
3. Usar `userId` como referência em `sales` e `contracts`
4. Migrar dados existentes de `clients` para `users` (se houver)

