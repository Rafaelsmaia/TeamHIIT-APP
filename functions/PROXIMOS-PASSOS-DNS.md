# ✅ Próximos Passos Após Adicionar DNS

## ⏱️ Passo 1: Aguardar Propagação DNS

Após adicionar os registros DNS, você precisa aguardar a propagação:

- **Tempo mínimo:** 5-15 minutos
- **Tempo médio:** 30-60 minutos
- **Tempo máximo:** 24 horas (raro)

**O que acontece:** Os servidores DNS do mundo todo precisam atualizar suas informações sobre seu domínio.

---

## 🔍 Passo 2: Verificar no Resend

1. **Volte para a tela do Resend** onde você viu os registros DNS
2. **Clique no botão "Restart"** ou **"Verificar"** (se houver)
3. **Aguarde alguns segundos** enquanto o Resend verifica os registros
4. **O status deve mudar:**
   - ❌ **"Pending"** → ✅ **"Verified"**

---

## ✅ Passo 3: Atualizar Configuração

Quando o domínio estiver verificado, atualize o arquivo `.env`:

```env
RESEND_API_KEY=re_Hxg6wmLV_EavGLhtS5cMdQfxyvEb8pHX5
RESEND_FROM_EMAIL=noreply@teamhiit.com.br
APP_LOGIN_URL=https://app.teamhiit.com.br
```

**⚠️ IMPORTANTE:** Use `noreply@teamhiit.com.br` (com @, não ponto)

---

## 🧪 Passo 4: Testar o Envio de Email

Depois que o domínio estiver verificado, teste o script:

```bash
cd functions
node send-email-manually.js seu-email@exemplo.com "Seu Nome"
```

**Agora você poderá enviar para QUALQUER email!** 🎉

---

## 🔍 Como Verificar se os Registros Estão Corretos (Opcional)

Você pode verificar se os registros DNS foram propagados usando ferramentas online:

### **Verificar DKIM:**
1. Acesse: https://mxtoolbox.com/TXTLookup.aspx
2. Digite: `reenviar._domainkey.noreply.teamhiit.com.br`
3. Clique em "TXT Lookup"
4. Deve aparecer o registro DKIM

### **Verificar SPF:**
1. Acesse: https://mxtoolbox.com/TXTLookup.aspx
2. Digite: `enviar.noreply.teamhiit.com.br`
3. Clique em "TXT Lookup"
4. Deve aparecer: `v=spf1 include:amazonses.com ~all`

### **Verificar MX:**
1. Acesse: https://mxtoolbox.com/SuperTool.aspx
2. Digite: `enviar.noreply.teamhiit.com.br`
3. Selecione "MX Lookup"
4. Deve aparecer: `feedback-smtp.sa-east-1.amazonses.com`

---

## ❌ Se o Status Continuar "Pending"

Se após 1 hora o status ainda estiver "Pending":

1. **Verifique se os registros estão corretos:**
   - Nome está correto?
   - Conteúdo está completo?
   - Prioridade está correta (10 para MX)?

2. **Verifique a propagação DNS:**
   - Use as ferramentas acima para ver se os registros aparecem

3. **Tente novamente no Resend:**
   - Clique em "Restart" novamente
   - Aguarde mais alguns minutos

4. **Entre em contato com o suporte da HostGator:**
   - Pode haver algum problema com a configuração DNS

---

## 🎉 Quando Estiver Verificado

Quando o domínio estiver verificado (status "Verified"):

✅ Você poderá usar `noreply@teamhiit.com.br` como remetente  
✅ O script de envio manual funcionará completamente  
✅ O webhook da Greenn enviará emails normalmente  
✅ Você poderá enviar emails para qualquer destinatário!  

---

## 📝 Resumo dos Próximos Passos

1. ⏱️ **Aguarde 15-60 minutos** para propagação DNS
2. 🔍 **Volte para o Resend** e clique em "Restart"
3. ✅ **Verifique se o status mudou para "Verified"**
4. 🔧 **Atualize o arquivo `.env`** com `noreply@teamhiit.com.br`
5. 🧪 **Teste o script** de envio de email

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Tire um print da tela do Resend mostrando o status
2. Verifique os registros DNS usando as ferramentas acima
3. Me avise qual é o problema específico

