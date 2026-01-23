# 🔐 Como Verificar o Domínio no Resend

Guia passo a passo para adicionar os registros DNS e verificar o domínio `teamhiit.com.br` no Resend.

## 📋 O que você precisa fazer

Adicionar **3 registros DNS** no seu provedor de domínio (onde você comprou o domínio `teamhiit.com.br`).

---

## 🔍 Passo 1: Identificar seu Provedor de Domínio

O domínio `teamhiit.com.br` está registrado em qual provedor?
- **Registro.br** (mais comum para .com.br)
- **GoDaddy**
- **Namecheap**
- **Cloudflare**
- **Outro**

---

## 📝 Passo 2: Adicionar os Registros DNS

Você precisa adicionar **3 registros** na tela do Resend:

### **Registro 1: DKIM (DomainKeys Identified Mail)**

**Tipo:** `TXT`  
**Nome:** `resend._domainkey`  
**Conteúdo:** (copie da tela do Resend - começa com `p=MIGfMA0GCSqGSIb3DQEB...`)  
**TTL:** `Auto` ou `3600`

### **Registro 2: SPF - MX Record**

**Tipo:** `MX`  
**Nome:** `send`  
**Conteúdo:** `feedback-smtp.sa-east-1.amazonses.com` (ou o que aparecer na tela)  
**Prioridade:** `10`  
**TTL:** `Auto` ou `3600`

### **Registro 3: SPF - TXT Record**

**Tipo:** `TXT`  
**Nome:** `send`  
**Conteúdo:** `v=spf1 include:amazonses.com ~all` (ou o que aparecer na tela)  
**TTL:** `Auto` ou `3600`

---

## 🎯 Passo 3: Como Adicionar (Registro.br)

Se seu domínio está no **Registro.br**:

1. Acesse [registro.br](https://registro.br)
2. Faça login
3. Vá em **Meus Domínios** > **teamhiit.com.br**
4. Clique em **DNS** ou **Zona DNS**
5. Clique em **Adicionar Registro**

**Para cada registro:**

1. **DKIM:**
   - Tipo: `TXT`
   - Nome: `resend._domainkey`
   - Valor: (cole o conteúdo completo da tela do Resend)
   - TTL: `3600`

2. **SPF - MX:**
   - Tipo: `MX`
   - Nome: `send`
   - Valor: `feedback-smtp.sa-east-1.amazonses.com`
   - Prioridade: `10`
   - TTL: `3600`

3. **SPF - TXT:**
   - Tipo: `TXT`
   - Nome: `send`
   - Valor: `v=spf1 include:amazonses.com ~all`
   - TTL: `3600`

6. Salve cada registro

---

## 🎯 Passo 3: Como Adicionar (Outros Provedores)

### **GoDaddy:**
1. Acesse [godaddy.com](https://godaddy.com)
2. Vá em **Meus Produtos** > **DNS**
3. Clique em **Adicionar** para cada registro

### **Cloudflare:**
1. Acesse [cloudflare.com](https://cloudflare.com)
2. Selecione o domínio
3. Vá em **DNS** > **Records**
4. Clique em **Add record** para cada registro

### **Namecheap:**
1. Acesse [namecheap.com](https://namecheap.com)
2. Vá em **Domain List** > **Manage**
3. Clique em **Advanced DNS**
4. Adicione cada registro

---

## ⏱️ Passo 4: Aguardar Propagação

Após adicionar os registros:

1. **Aguarde 5-60 minutos** (pode levar até 24 horas)
2. Volte para a tela do Resend
3. Clique em **"Restart"** ou **"Verify"** (se houver)
4. O status deve mudar de **"Pending"** para **"Verified"** ✅

---

## ✅ Passo 5: Verificar se Funcionou

Quando o domínio estiver verificado:

1. O status na tela do Resend mudará para **"Verified"** ✅
2. Você poderá usar `noreply@teamhiit.com.br` como remetente
3. Atualize o arquivo `.env`:

```env
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
```

4. Teste novamente o script de envio de email!

---

## 🔍 Como Verificar se os Registros Foram Adicionados

Você pode verificar se os registros estão corretos usando ferramentas online:

1. **DKIM:**
   ```bash
   nslookup -type=TXT resend._domainkey.teamhiit.com.br
   ```

2. **SPF:**
   ```bash
   nslookup -type=TXT send.teamhiit.com.br
   ```

3. **MX:**
   ```bash
   nslookup -type=MX send.teamhiit.com.br
   ```

Ou use ferramentas online:
- [mxtoolbox.com](https://mxtoolbox.com)
- [dnschecker.org](https://dnschecker.org)

---

## ❌ Problemas Comuns

### **"Registros não encontrados"**
- Aguarde mais tempo (pode levar até 24 horas)
- Verifique se copiou o conteúdo completo (especialmente o DKIM)
- Verifique se o nome está correto (com ou sem o domínio, dependendo do provedor)

### **"TTL muito alto"**
- Use TTL de 3600 (1 hora) ou Auto
- Não use valores muito altos (86400+)

### **"Nome incorreto"**
- Alguns provedores pedem apenas `resend._domainkey`
- Outros pedem `resend._domainkey.teamhiit.com.br`
- Verifique a documentação do seu provedor

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas sobre onde adicionar os registros:
1. Consulte a documentação do seu provedor de domínio
2. Entre em contato com o suporte do provedor
3. Ou me avise qual é o provedor e eu te ajudo com os passos específicos!

---

## 🎉 Depois que Verificar

Quando o domínio estiver verificado:
1. ✅ Você poderá enviar emails para qualquer destinatário
2. ✅ O script de envio manual funcionará completamente
3. ✅ O webhook da Greenn enviará emails normalmente

