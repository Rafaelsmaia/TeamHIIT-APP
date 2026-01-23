# 🧪 Teste da Integração GreenN

## 📋 Como Testar a Integração

### 1. 🔧 Configurar as Chaves

**Crie um arquivo `.env` na raiz do projeto:**

```env
# GreenN API Configuration
REACT_APP_GREENN_API_URL=https://api.greenn.com.br
REACT_APP_GREENN_API_KEY=$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf
REACT_APP_GREENN_PUBLIC_KEY=$2y$10$7H47GgS310PMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzc
REACT_APP_GREENN_WEBHOOK_TOKEN=$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTlyR7DPvS8GENpzRVjO
REACT_APP_GREENN_ENVIRONMENT=production
```

### 2. 🚀 Iniciar o Servidor

```bash
npm start
```

### 3. 🧪 Executar Testes Automáticos

**No console do navegador (F12), execute:**

```javascript
// Importar e executar os testes
import { runAllTests } from './src/utils/testGreenNIntegration.js';

// Executar todos os testes
runAllTests().then(result => {
  console.log('🎯 Resultado final:', result ? '✅ Todos os testes passaram!' : '❌ Alguns testes falharam');
});
```

### 4. 🔍 Testes Manuais

#### **4.1 Testar Login:**

1. **Acesse:** `http://localhost:5174/form`
2. **Use credenciais** de um usuário cadastrado na GreenN
3. **Verifique se:**
   - O login funciona
   - Redireciona para o dashboard
   - Não há erros no console

#### **4.2 Testar Status da Assinatura:**

1. **Acesse o dashboard** após o login
2. **Verifique se:**
   - O componente de status da assinatura aparece
   - Mostra o plano atual do usuário
   - Exibe funcionalidades disponíveis

#### **4.3 Testar Controle de Funcionalidades:**

1. **Verifique se** as funcionalidades são controladas pelo plano:
   - Usuários gratuitos veem funcionalidades limitadas
   - Usuários premium veem todas as funcionalidades
   - Botões de upgrade aparecem quando necessário

### 5. 📊 Verificar Logs

**No console do navegador, verifique:**

```javascript
// Verificar se as chaves estão configuradas
console.log('API Key:', process.env.REACT_APP_GREENN_API_KEY);
console.log('Public Key:', process.env.REACT_APP_GREENN_PUBLIC_KEY);
console.log('Webhook Token:', process.env.REACT_APP_GREENN_WEBHOOK_TOKEN);

// Verificar se os serviços estão funcionando
console.log('GreenN Integration:', greenNIntegration);
```

### 6. 🐛 Solução de Problemas

#### **Problema: Chaves não configuradas**
```
⚠️ [Config] Chaves não configuradas: ['REACT_APP_GREENN_API_KEY']
```
**Solução:** Verifique se o arquivo `.env` está na raiz do projeto e contém as chaves corretas.

#### **Problema: Erro de autenticação**
```
❌ [GreenN] Erro ao validar credenciais: 401 Unauthorized
```
**Solução:** Verifique se as chaves estão corretas e se a API da GreenN está acessível.

#### **Problema: Componente não aparece**
```
❌ [Test] Erro ao importar componentes: Cannot resolve module
```
**Solução:** Verifique se todos os arquivos foram criados corretamente.

### 7. ✅ Checklist de Testes

- [ ] Arquivo `.env` criado com as chaves
- [ ] Servidor iniciado sem erros
- [ ] Login funciona com credenciais válidas
- [ ] Status da assinatura aparece no dashboard
- [ ] Funcionalidades são controladas pelo plano
- [ ] Não há erros no console
- [ ] Testes automáticos passam

### 8. 📱 Teste no Mobile

1. **Gerar APK:**
```bash
npx cap build android
```

2. **Instalar no dispositivo**
3. **Testar login** com credenciais reais
4. **Verificar funcionalidades** no mobile

### 9. 🚀 Deploy em Produção

1. **Configurar variáveis de ambiente** no servidor
2. **Fazer build:**
```bash
npm run build
```

3. **Deploy:**
```bash
firebase deploy
```

4. **Testar em produção** com usuários reais

---

## 🎯 Resultado Esperado

Após todos os testes, você deve ter:

- ✅ **Login integrado** com GreenN funcionando
- ✅ **Status da assinatura** sendo exibido
- ✅ **Controle de funcionalidades** por plano
- ✅ **Sincronização de dados** entre plataformas
- ✅ **Sem erros** no console ou na aplicação

**🎉 A integração estará funcionando perfeitamente!**
