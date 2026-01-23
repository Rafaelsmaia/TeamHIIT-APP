# 🎨 Como Personalizar o Email de Boas-Vindas

## 📍 Onde Personalizar?

**Resposta:** No **Firebase Functions**, não no Resend!

- **Resend** = Apenas envia o email (plataforma de entrega)
- **Firebase Functions** = Gera o conteúdo e design do email

## 📂 Arquivo para Editar

```
functions/src/email.js
```

## 🎯 O que Você Pode Personalizar

### 1. **Assunto do Email** (Linha 63)

```javascript
subject: "Bem-vindo ao Team HIIT! Suas credenciais de acesso",
```

**Exemplo de alteração:**
```javascript
subject: "🎉 Bem-vindo! Sua conta Team HIIT está pronta!",
```

### 2. **Cores e Gradientes** (Linha 106)

```javascript
background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
```

**Exemplo de alteração:**
```javascript
// Cores da sua marca
background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
// Ou cor sólida
background: #ff6b35;
```

### 3. **Título do Header** (Linha 107)

```javascript
<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo ao Team HIIT!</h1>
```

**Exemplo de alteração:**
```javascript
<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎯 Bem-vindo à Família Team HIIT!</h1>
```

### 4. **Mensagem de Boas-Vindas** (Linha 114-120)

```javascript
<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
  Olá <strong>${name}</strong>,
</p>

<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
  Estamos muito felizes em tê-lo(a) conosco! Sua assinatura foi ativada com sucesso e você já pode acessar todos os treinos exclusivos do Team HIIT.
</p>
```

**Exemplo de alteração:**
```javascript
<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
  Olá <strong>${name}</strong>! 👋
</p>

<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
  Que alegria ter você conosco! 🎉<br>
  Sua assinatura foi ativada e você já tem acesso completo a todos os nossos treinos exclusivos, planos de alimentação e muito mais!
</p>
```

### 5. **Adicionar Logo** (Após linha 107)

```javascript
<!-- Logo -->
<tr>
  <td style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
    <img src="https://app.teamhiit.com.br/icons/icon-192.webp" alt="Team HIIT Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo ao Team HIIT!</h1>
  </td>
</tr>
```

### 6. **Texto do Botão** (Linha 145)

```javascript
<a href="${loginUrl}" style="...">
  Fazer Login Agora
</a>
```

**Exemplo de alteração:**
```javascript
<a href="${loginUrl}" style="...">
  🚀 Começar Agora
</a>
```

### 7. **Aviso de Segurança** (Linha 150-154)

```javascript
<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 5px;">
  <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
    <strong>⚠️ Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha após o primeiro acesso. Esta senha é temporária e foi gerada automaticamente.
  </p>
</div>
```

### 8. **Rodapé** (Linha 168-177)

```javascript
<tr>
  <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
    <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
      © ${new Date().getFullYear()} Team HIIT. Todos os direitos reservados.
    </p>
    <p style="color: #999999; font-size: 12px; margin: 0;">
      Este é um email automático, por favor não responda.
    </p>
  </td>
</tr>
```

**Exemplo de alteração (adicionar links sociais):**
```javascript
<tr>
  <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
    <!-- Links Sociais -->
    <div style="margin-bottom: 15px;">
      <a href="https://instagram.com/teamhiit" style="margin: 0 10px; color: #ff6b35; text-decoration: none;">Instagram</a>
      <a href="https://facebook.com/teamhiit" style="margin: 0 10px; color: #ff6b35; text-decoration: none;">Facebook</a>
      <a href="https://teamhiit.com.br" style="margin: 0 10px; color: #ff6b35; text-decoration: none;">Website</a>
    </div>
    
    <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
      © ${new Date().getFullYear()} Team HIIT. Todos os direitos reservados.
    </p>
    <p style="color: #999999; font-size: 12px; margin: 0;">
      Este é um email automático, por favor não responda.
    </p>
  </td>
</tr>
```

## 🎨 Exemplo Completo de Personalização

### Adicionar Seção de Benefícios

```javascript
<!-- Benefícios -->
<tr>
  <td style="padding: 0 30px 30px 30px;">
    <h3 style="color: #333333; font-size: 18px; margin: 0 0 20px 0;">O que você tem acesso:</h3>
    <ul style="color: #666666; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
      <li>✅ Treinos exclusivos de HIIT</li>
      <li>✅ Planos de alimentação personalizados</li>
      <li>✅ Acompanhamento de progresso</li>
      <li>✅ Suporte da equipe</li>
    </ul>
  </td>
</tr>
```

### Adicionar Imagem de Destaque

```javascript
<!-- Imagem -->
<tr>
  <td style="padding: 30px; text-align: center;">
    <img src="https://app.teamhiit.com.br/IMAGES/bem-vindo.jpg" alt="Bem-vindo" style="max-width: 100%; height: auto; border-radius: 10px;" />
  </td>
</tr>
```

## 📝 Versão Texto (Fallback)

Também personalize a versão texto em `getWelcomeEmailText()` (linha 196) para clientes de email que não suportam HTML.

## 🚀 Como Aplicar as Mudanças

1. **Edite o arquivo:**
   ```
   functions/src/email.js
   ```

2. **Teste localmente (opcional):**
   ```bash
   cd functions
   npm run serve
   ```

3. **Faça deploy:**
   ```bash
   firebase deploy --only functions:greennWebhook
   ```

4. **Teste enviando uma compra de teste** na Greenn

## ⚠️ Dicas Importantes

### ✅ Boas Práticas:
- Use **cores inline** (no atributo `style`) - muitos clientes de email não suportam CSS externo
- Use **tabelas** para layout - é mais compatível
- Teste em diferentes clientes de email (Gmail, Outlook, etc.)
- Mantenha a largura máxima em **600px**
- Use **imagens hospedadas** (não anexos)

### ❌ Evite:
- CSS externo (`<link>` ou `<style>`)
- JavaScript
- Imagens muito grandes
- Fontes customizadas (use Arial, Helvetica, etc.)

## 🔍 Verificar Resultado

Após fazer deploy, envie um teste e verifique:
1. **Logs do Firebase:**
   ```bash
   firebase functions:log --only greennWebhook
   ```

2. **Caixa de entrada** do email de teste

3. **Diferentes clientes de email** (Gmail, Outlook, Apple Mail)

## 📚 Recursos Úteis

- [Email on Acid](https://www.emailonacid.com/) - Teste de compatibilidade
- [Can I Email](https://www.caniemail.com/) - Suporte de CSS em emails
- [MJML](https://mjml.io/) - Framework para criar emails responsivos (opcional)

