# 🌐 Como Adicionar Registros DNS na HostGator

Guia passo a passo para adicionar os registros DNS do Resend no subdomínio `noreply.teamhiit.com.br` na HostGator.

## 📋 Passo 1: Acessar o cPanel da HostGator

1. Acesse o **cPanel** da HostGator:
   - URL geralmente é: `https://seu-dominio.com.br:2083` ou `https://cpanel.hostgator.com.br`
   - Ou acesse pelo painel da HostGator e clique em **"Acessar cPanel"**

2. Faça login com suas credenciais

---

## 📝 Passo 2: Encontrar a Zona DNS

1. No cPanel, procure por **"Zona DNS"** ou **"DNS Zone Editor"**
   - Pode estar em **"Domínios"** ou **"Avançado"**
   - Ou use a busca no topo do cPanel

2. Clique em **"Zona DNS"** ou **"DNS Zone Editor"**

3. Selecione o domínio **`teamhiit.com.br`**

---

## 🔧 Passo 3: Adicionar os Registros DNS

Você precisa adicionar **3 registros** para o subdomínio `noreply.teamhiit.com.br`:

### **Registro 1: DKIM (Verificação de Domínio)**

1. Clique em **"Adicionar Registro"** ou **"Add Record"**

2. Preencha:
   - **Tipo:** `TXT`
   - **Nome:** `reenviar._domainkey.noreply`
     - ⚠️ **IMPORTANTE:** Na HostGator, você pode precisar usar apenas `reenviar._domainkey.noreply` (sem o `.teamhiit.com.br` no final)
   - **TTL:** `3600` ou `Automático`
   - **Conteúdo/TXT Data:** Cole o valor completo que aparece na tela do Resend
     - Começa com `p=MIGfMA0GCSqGSIb3DQEB...`
     - **Copie o valor COMPLETO** (pode ser muito longo)

3. Clique em **"Adicionar Registro"** ou **"Add Record"**

---

### **Registro 2: SPF - MX (Habilitar Envio)**

1. Clique em **"Adicionar Registro"** novamente

2. Preencha:
   - **Tipo:** `MX`
   - **Nome:** `enviar.noreply`
     - ⚠️ **IMPORTANTE:** Na HostGator, use apenas `enviar.noreply` (sem o `.teamhiit.com.br`)
   - **TTL:** `3600` ou `Automático`
   - **Prioridade:** `10`
   - **Destino/Conteúdo:** `feedback-smtp.sa-east-1.amazonses.com`
     - (ou o valor completo que aparece na tela do Resend)

3. Clique em **"Adicionar Registro"**

---

### **Registro 3: SPF - TXT (Habilitar Envio)**

1. Clique em **"Adicionar Registro"** novamente

2. Preencha:
   - **Tipo:** `TXT`
   - **Nome:** `enviar.noreply`
     - ⚠️ **IMPORTANTE:** Na HostGator, use apenas `enviar.noreply` (sem o `.teamhiit.com.br`)
   - **TTL:** `3600` ou `Automático`
   - **Conteúdo/TXT Data:** `v=spf1 include:amazonses.com ~all`
     - (ou o valor completo que aparece na tela do Resend)

3. Clique em **"Adicionar Registro"**

---

## ⚠️ IMPORTANTE: Formato do Nome na HostGator

Na HostGator, o campo **"Nome"** pode funcionar de duas formas:

### **Opção A: Nome Relativo (Recomendado)**
- Use apenas: `reenviar._domainkey.noreply`
- Use apenas: `enviar.noreply`
- A HostGator adiciona automaticamente `.teamhiit.com.br` no final

### **Opção B: Nome Completo**
- Use: `reenviar._domainkey.noreply.teamhiit.com.br`
- Use: `enviar.noreply.teamhiit.com.br`

**💡 Dica:** Tente primeiro a **Opção A**. Se não funcionar, use a **Opção B**.

---

## 📋 Resumo dos Registros

| Tipo | Nome | Conteúdo | Prioridade |
|------|------|----------|------------|
| TXT | `reenviar._domainkey.noreply` | `p=MIGfMA0GCSqGSIb3DQEB...` (valor completo do Resend) | - |
| MX | `enviar.noreply` | `feedback-smtp.sa-east-1.amazonses.com` | 10 |
| TXT | `enviar.noreply` | `v=spf1 include:amazonses.com ~all` | - |

---

## ⏱️ Passo 4: Aguardar Propagação

Após adicionar os registros:

1. **Aguarde 5-60 minutos** (pode levar até 24 horas)
2. Volte para a tela do Resend
3. Clique em **"Restart"** ou **"Verificar"** (se houver)
4. O status deve mudar de **"Pending"** para **"Verified"** ✅

---

## ✅ Passo 5: Verificar se Funcionou

### **Verificar no Resend:**
- O status deve mudar para **"Verified"** ✅

### **Verificar via Terminal (Opcional):**
```bash
# Verificar DKIM
nslookup -type=TXT reenviar._domainkey.noreply.teamhiit.com.br

# Verificar SPF
nslookup -type=TXT enviar.noreply.teamhiit.com.br

# Verificar MX
nslookup -type=MX enviar.noreply.teamhiit.com.br
```

---

## 🔧 Atualizar Configuração do Script

Depois que o domínio estiver verificado, atualize o arquivo `.env`:

```env
RESEND_API_KEY=re_Hxg6wmLV_EavGLhtS5cMdQfxyvEb8pHX5
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
APP_LOGIN_URL=https://app.teamhiit.com.br
```

**⚠️ IMPORTANTE:** Use `noreply@teamhiit.com.br` (não `noreply.teamhiit.com.br`)

---

## ❌ Problemas Comuns

### **"Registros não encontrados"**
- Verifique se o nome está correto (com ou sem `.teamhiit.com.br`)
- Aguarde mais tempo (pode levar até 24 horas)
- Verifique se copiou o conteúdo completo (especialmente o DKIM)

### **"Não consigo encontrar Zona DNS no cPanel"**
- Procure por **"DNS Zone Editor"** ou **"Editor de Zona DNS"**
- Ou entre em contato com o suporte da HostGator

### **"Erro ao adicionar registro"**
- Verifique se o subdomínio `noreply.teamhiit.com.br` foi criado primeiro
- Certifique-se de que não há registros duplicados
- Tente usar o nome completo (com `.teamhiit.com.br`)

---

## 📞 Precisa de Ajuda?

Se tiver dificuldades:
1. Tire um print da tela do cPanel da HostGator
2. Verifique se o subdomínio `noreply.teamhiit.com.br` existe
3. Entre em contato com o suporte da HostGator se necessário

---

## 🎉 Depois que Verificar

Quando o subdomínio estiver verificado:
1. ✅ Você poderá usar `noreply@teamhiit.com.br` como remetente
2. ✅ O script de envio manual funcionará completamente
3. ✅ O webhook da Greenn enviará emails normalmente
4. ✅ Você poderá enviar emails para qualquer destinatário!

