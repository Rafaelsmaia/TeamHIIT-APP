# 📧 Como Preencher o Registro MX na HostGator

## 🎯 Registro 2: SPF - MX

Na tela que você está vendo, preencha os campos assim:

### **Campo "Nome" (já preenchido):**
- ✅ Deixe como está: `send.noreply.teamhiit.com.br.`
- Ou se estiver vazio, digite: `send.noreply`

### **Campo "TTL":**
- ✅ Deixe como está: `14400`
- Ou digite: `3600`

### **Campo "Tipo":**
- ✅ Já está correto: `MX`

### **Campo "Prioridade" (OBRIGATÓRIO):**
- ⚠️ **Digite:** `10`
- Este campo está vazio e precisa ser preenchido!

### **Campo "Destino" (OBRIGATÓRIO):**
- ⚠️ **Digite exatamente:** `feedback-smtp.sa-east-1.amazonses.com`
- **IMPORTANTE:** Digite manualmente, não cole (pode ter problemas ao colar)
- Ou copie e cole com cuidado, verificando se não há espaços extras

---

## ✅ Resumo do que preencher:

| Campo | Valor |
|-------|-------|
| Nome | `send.noreply.teamhiit.com.br.` (já preenchido) |
| TTL | `14400` ou `3600` |
| Tipo | `MX` (já selecionado) |
| **Prioridade** | **`10`** ⚠️ |
| **Destino** | **`feedback-smtp.sa-east-1.amazonses.com`** ⚠️ |

---

## 🔧 Se não conseguir colar:

1. **Digite manualmente** o destino: `feedback-smtp.sa-east-1.amazonses.com`
2. Verifique se não há espaços antes ou depois
3. Verifique se está tudo em minúsculas
4. Não adicione ponto (.) no final

---

## ✅ Depois de preencher:

1. Clique em **"Salvar Alteração"** (botão azul)
2. Se aparecer algum erro, verifique se:
   - A Prioridade é exatamente `10` (número, sem espaços)
   - O Destino está correto e sem espaços extras

---

## 📋 Próximo Passo:

Depois de salvar o Registro MX, você precisará adicionar o **Registro 3 (SPF - TXT)**:
- Tipo: `TXT`
- Nome: `send.noreply` ou `send.noreply.teamhiit.com.br.`
- Conteúdo: `v=spf1 include:amazonses.com ~all`

