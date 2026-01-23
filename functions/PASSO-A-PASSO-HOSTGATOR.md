# 📝 Passo a Passo: Adicionar DNS na HostGator

## 🎯 Passo 1: Acessar os Registros DNS

Na tela que você está vendo:

1. **Localize o domínio** `teamhiit.com.br` na lista
2. **Clique no botão "Gerenciar"** (ícone de chave inglesa 🔧) na coluna "Ações"
3. Isso abrirá a lista de **todos os registros DNS** do domínio, incluindo subdomínios

---

## 🔍 Passo 2: Verificar se o Subdomínio Existe

Na tela de "Gerenciar", você verá uma lista com todos os registros DNS.

**Procure por:**
- `noreply.teamhiit.com.br` ou
- Registros que começam com `noreply`

**Se o subdomínio NÃO aparecer:**
- Você precisa criar o subdomínio primeiro
- Vá em **"Subdomínios"** no cPanel e crie `noreply.teamhiit.com.br`

---

## ➕ Passo 3: Adicionar os Registros DNS

Na tela de "Gerenciar", você verá botões para adicionar registros. Adicione os **3 registros**:

### **Registro 1: DKIM (TXT)**

1. Clique em **"+ Registro TXT"** ou **"Adicionar Registro TXT"**
2. Preencha:
   - **Nome:** `reenviar._domainkey.noreply`
     - ⚠️ **IMPORTANTE:** Na HostGator, você pode precisar usar apenas `reenviar._domainkey.noreply` (sem `.teamhiit.com.br`)
   - **TTL:** `3600` ou deixe em branco (automático)
   - **Conteúdo/TXT Data:** Cole o valor completo do Resend
     - Começa com `p=MIGfMA0GCSqGSIb3DQEB...`
     - **Copie o valor COMPLETO** da tela do Resend
3. Clique em **"Adicionar Registro"** ou **"Salvar"**

---

### **Registro 2: SPF - MX**

1. Clique em **"+ Registro MX"** ou **"Adicionar Registro MX"**
2. Preencha:
   - **Nome:** `enviar.noreply`
     - ⚠️ **IMPORTANTE:** Use apenas `enviar.noreply` (sem `.teamhiit.com.br`)
   - **TTL:** `3600` ou deixe em branco
   - **Prioridade:** `10`
   - **Destino:** `feedback-smtp.sa-east-1.amazonses.com`
     - (ou o valor completo que aparece na tela do Resend)
3. Clique em **"Adicionar Registro"** ou **"Salvar"**

---

### **Registro 3: SPF - TXT**

1. Clique em **"+ Registro TXT"** novamente
2. Preencha:
   - **Nome:** `enviar.noreply`
     - ⚠️ **IMPORTANTE:** Use apenas `enviar.noreply` (sem `.teamhiit.com.br`)
   - **TTL:** `3600` ou deixe em branco
   - **Conteúdo/TXT Data:** `v=spf1 include:amazonses.com ~all`
     - (ou o valor completo que aparece na tela do Resend)
3. Clique em **"Adicionar Registro"** ou **"Salvar"**

---

## ⚠️ IMPORTANTE: Formato do Nome

Na HostGator, quando você está na tela de "Gerenciar" registros DNS, o campo **"Nome"** pode funcionar de duas formas:

### **Opção A: Nome Relativo (Recomendado)**
- Use: `reenviar._domainkey.noreply`
- Use: `enviar.noreply`
- A HostGator adiciona automaticamente `.teamhiit.com.br` no final

### **Opção B: Nome Completo**
- Use: `reenviar._domainkey.noreply.teamhiit.com.br`
- Use: `enviar.noreply.teamhiit.com.br`

**💡 Dica:** Tente primeiro a **Opção A**. Se não funcionar, use a **Opção B**.

---

## 📋 Resumo dos 3 Registros

| Tipo | Nome | Conteúdo | Prioridade |
|------|------|----------|------------|
| TXT | `reenviar._domainkey.noreply` | `p=MIGfMA0GCSqGSIb3DQEB...` (valor completo do Resend) | - |
| MX | `enviar.noreply` | `feedback-smtp.sa-east-1.amazonses.com` | 10 |
| TXT | `enviar.noreply` | `v=spf1 include:amazonses.com ~all` | - |

---

## 🔍 Se Não Encontrar o Botão "+ Registro TXT"

Se na tela de "Gerenciar" você não ver botões para adicionar registros:

1. Procure por um botão **"Adicionar Registro"** ou **"Add Record"** no topo
2. Ou procure por um botão **"+"** ou **"Novo Registro"**
3. Quando clicar, você poderá escolher o tipo de registro (TXT, MX, etc.)

---

## ✅ Depois de Adicionar

1. **Aguarde 5-60 minutos** (pode levar até 24 horas)
2. Volte para a tela do Resend
3. Clique em **"Restart"** ou aguarde a verificação automática
4. O status deve mudar para **"Verified"** ✅

---

## 🆘 Se o Subdomínio Não Existe

Se você não encontrar o subdomínio `noreply.teamhiit.com.br` na lista:

1. **Crie o subdomínio primeiro:**
   - No cPanel, procure por **"Subdomínios"** ou **"Subdomains"**
   - Clique em **"Criar Subdomínio"** ou **"Create Subdomain"**
   - Nome: `noreply`
   - Domínio: `teamhiit.com.br`
   - Clique em **"Criar"**

2. **Depois volte para a Zona DNS** e adicione os registros conforme descrito acima

---

## 📞 Precisa de Ajuda?

Se tiver dificuldades:
1. Tire um print da tela de "Gerenciar" e me mostre
2. Verifique se o subdomínio `noreply.teamhiit.com.br` foi criado
3. Entre em contato com o suporte da HostGator se necessário

