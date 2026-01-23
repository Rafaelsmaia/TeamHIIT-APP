# 📧 Reenviar Emails para Usuários que Não Receberam

## 🚨 **SITUAÇÃO**

Dos últimos 286 registros:
- ✅ **138 receberam** o email (48%)
- ❌ **148 NÃO receberam** o email (52%)

---

## 📋 **COMO REENVIAR TODOS OS EMAILS**

### **Passo 1: Acessar a pasta functions**

```bash
cd functions
```

### **Passo 2: Executar o script de reenvio**

```bash
node resend-all-failed.js
```

### **O que o script faz:**

1. 🔍 Busca todos os registros em `user_credentials` onde `sent: false`
2. 🔐 Tenta localizar o usuário correto no Firebase Auth
3. 📧 Envia o email com as credenciais
4. ✅ Atualiza o status para `sent: true`
5. 📊 Mostra um resumo ao final

---

## ⏱️ **TEMPO ESTIMADO**

- **148 emails** × **0.5 segundos cada** = ~**1-2 minutos**

---

## 🔍 **REENVIAR APENAS PARA UM USUÁRIO ESPECÍFICO**

Se quiser reenviar para apenas um usuário:

```bash
node resend-email.js email@exemplo.com
```

---

## ⚠️ **IMPORTANTE**

Este script:
- ✅ É seguro - só envia para quem não recebeu
- ✅ Atualiza automaticamente o status
- ✅ Tem proteção contra duplicação
- ✅ Mostra erros detalhados
- ❌ **NÃO** reenvia para quem já recebeu

---

## 🔧 **PRÓXIMOS PASSOS**

Após reenviar os emails, precisamos:

1. **Investigar a causa raiz** da duplicação de registros
2. **Corrigir o webhook** da Greenn para evitar IDs duplicados
3. **Limpar registros duplicados** no Firestore

---

## 💡 **DICA**

Após executar, verifique:
- Quantos emails foram enviados com sucesso
- Quantos falharam e por quê
- Se há erros recorrentes


