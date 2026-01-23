# 👀 Como Visualizar o Email de Boas-Vindas

## 🚀 Método Rápido (Recomendado)

### **Passo 1: Gerar o Preview**

Execute o comando na raiz do projeto:

```bash
cd functions
node preview-email.js
```

Ou use o script npm:

```bash
cd functions
npm run preview-email
```

### **Passo 2: Abrir no Navegador**

O script gera um arquivo `functions/preview-email.html`. Abra este arquivo no seu navegador:

- **Windows:** Clique duas vezes no arquivo ou arraste para o navegador
- **Mac/Linux:** `open functions/preview-email.html` ou `xdg-open functions/preview-email.html`

## 📝 Personalizar Dados de Exemplo

Para ver o email com diferentes dados, edite o arquivo `functions/preview-email.js`:

```javascript
// Dados de exemplo (linha ~70)
const exampleData = {
  name: "João Silva",           // ← Altere aqui
  email: "joao.silva@exemplo.com", // ← Altere aqui
  password: "Temp123!@#",        // ← Altere aqui
  loginUrl: "https://app.teamhiit.com.br/login"
};
```

Depois execute novamente:
```bash
cd functions
node preview-email.js
```

## 🔄 Atualizar Preview Após Editar o Template

Se você editou o template em `functions/src/email.js`, você precisa:

1. **Copiar as mudanças** para `functions/preview-email.js` (função `getWelcomeEmailTemplate`)
2. **Ou** atualizar o script para importar diretamente do arquivo original

## 📧 Outras Formas de Visualizar

### **Opção 2: Teste Real (Enviar para Você)**

1. Configure um email de teste no Resend
2. Faça uma compra de teste na Greenn
3. Verifique sua caixa de entrada

### **Opção 3: Usar Serviços Online**

1. Copie o HTML gerado em `preview-email.html`
2. Cole em serviços como:
   - [Email on Acid](https://www.emailonacid.com/)
   - [Litmus](https://www.litmus.com/)
   - [Putsmail](https://putsmail.com/)

### **Opção 4: Visualizar no Código**

Abra diretamente `functions/src/email.js` e veja a função `getWelcomeEmailTemplate()` (linha 90-185).

## 🎨 Dicas

- O preview mostra exatamente como o email será renderizado
- Teste em diferentes navegadores para verificar compatibilidade
- Use as ferramentas de desenvolvedor do navegador (F12) para inspecionar elementos
- Para testar em mobile, use o modo responsivo do navegador (F12 > Toggle device toolbar)

## 📂 Arquivos Relacionados

- `functions/preview-email.js` - Script de preview
- `functions/preview-email.html` - HTML gerado (abrir no navegador)
- `functions/src/email.js` - Template real usado em produção

