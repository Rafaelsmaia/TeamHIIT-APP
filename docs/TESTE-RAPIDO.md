# 🧪 Teste Rápido - Integração GreenN

## 🎯 **Solução Prática para Testar Usuários**

### **1. 🚀 Criar Usuário Teste no Firebase Console**

**Acesse:** https://console.firebase.google.com

1. **Vá para Authentication**
2. **Clique em "Add User"**
3. **Preencha:**
   - **Email:** `teste@greenn.com`
   - **Senha:** `123456789`
4. **Clique em "Add User"**

### **2. 📝 Adicionar Dados no Firestore**

**Vá para Firestore Database**

1. **Crie uma coleção:** `users`
2. **Adicione um documento** com ID = UID do usuário criado
3. **Adicione os campos:**

```json
{
  "email": "teste@greenn.com",
  "displayName": "Usuário Teste",
  "greenNUserId": "greenn_123456",
  "subscriptionStatus": {
    "isActive": true,
    "plan": "premium",
    "expiresAt": "2024-02-01T00:00:00Z"
  }
}
```

### **3. 🧪 Testar Login**

1. **Acesse:** `http://localhost:5174/#/form`
2. **Use as credenciais:**
   - **Email:** `teste@greenn.com`
   - **Senha:** `123456789`
3. **Verifique se** o login funciona

### **4. ✅ Verificar Funcionamento**

- ✅ **Login funcionando**
- ✅ **Status da assinatura** no dashboard
- ✅ **Plano Premium** exibido corretamente

---

## 🎉 **Pronto! Teste em 5 minutos!**

**Não precisa de código extra, não suja o projeto, e você pode testar a integração GreenN rapidamente!**
