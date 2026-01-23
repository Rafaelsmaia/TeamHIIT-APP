# 🎯 Instruções de Configuração da GreenN

## 📋 Passos para Configurar a Integração

### 1. 🔑 Obter as Chaves de Acesso

**Na área de configurações da GreenN (que você mostrou):**

1. **Public Key:** `$2y$10$7H47GgS310PMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzc`
2. **API Key:** `$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf`
3. **Webhook Token:** `$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTlyR7DPvS8GENpzRVjO`

### 2. 📝 Configurar Variáveis de Ambiente

**Crie um arquivo `.env` na raiz do projeto:**

```env
# GreenN API Configuration
REACT_APP_GREENN_API_URL=https://api.greenn.com.br
REACT_APP_GREENN_API_KEY=$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf
REACT_APP_GREENN_PUBLIC_KEY=$2y$10$7H47GgS310PMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzc
REACT_APP_GREENN_WEBHOOK_TOKEN=$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTlyR7DPvS8GENpzRVjO
REACT_APP_GREENN_ENVIRONMENT=production
```

### 3. 🔄 Substituir o Sistema de Login

**No arquivo `src/App.jsx`:**

```jsx
// ANTES:
import PWALogin from './components/PWALogin';

// DEPOIS:
import GreenNLogin from './components/GreenNLogin';
```

**E na rota:**

```jsx
// ANTES:
<Route path="/form" element={<PWALogin onLogin={login} />} />

// DEPOIS:
<Route path="/form" element={<GreenNLogin />} />
```

### 4. 🎯 Atualizar o Hook de Autenticação

**No arquivo `src/App.jsx`:**

```jsx
// ANTES:
import { usePWAAuth } from './hooks/UsePWAAuth';

// DEPOIS:
import { useGreenNAuth } from './hooks/useGreenNAuth';
```

### 5. 📊 Adicionar Status da Assinatura no Dashboard

**No arquivo `src/pages/Dashboard.jsx`:**

```jsx
import SubscriptionStatus from '../components/SubscriptionStatus';
import { useGreenNAuth } from '../hooks/useGreenNAuth';

function Dashboard() {
  const { subscriptionStatus } = useGreenNAuth();
  
  return (
    <div>
      {/* Conteúdo existente */}
      
      {/* Adicionar componente de status da assinatura */}
      <SubscriptionStatus 
        subscriptionStatus={subscriptionStatus}
        onUpgrade={() => {
          window.open('https://greenn.com.br/upgrade', '_blank');
        }}
      />
    </div>
  );
}
```

### 6. 🧪 Testar a Integração

**1. Iniciar o servidor:**
```bash
npm start
```

**2. Testar login:**
- Acesse `/form`
- Use credenciais de um usuário cadastrado na GreenN
- Verifique se o login funciona

**3. Verificar status da assinatura:**
- Acesse o dashboard
- Verifique se o componente de status da assinatura aparece
- Confirme se as funcionalidades estão sendo controladas pelo plano

### 7. 🚀 Deploy em Produção

**1. Configurar variáveis de ambiente no servidor:**
```bash
export REACT_APP_GREENN_API_URL=https://api.greenn.com.br
export REACT_APP_GREENN_API_KEY=$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf
export REACT_APP_GREENN_PUBLIC_KEY=$2y$10$7H47GgS310PMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzc
export REACT_APP_GREENN_WEBHOOK_TOKEN=$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTlyR7DPvS8GENpzRVjO
export REACT_APP_GREENN_ENVIRONMENT=production
```

**2. Fazer build:**
```bash
npm run build
```

**3. Deploy:**
```bash
firebase deploy
```

## 🔍 Verificação da Configuração

### ✅ Checklist de Configuração:

- [ ] Arquivo `.env` criado com as chaves
- [ ] Sistema de login substituído
- [ ] Hook de autenticação atualizado
- [ ] Status da assinatura adicionado ao dashboard
- [ ] Testes realizados
- [ ] Deploy em produção

### 🐛 Solução de Problemas:

**1. Erro de autenticação:**
- Verifique se as chaves estão corretas no `.env`
- Confirme se a URL da API está correta

**2. Status da assinatura não aparece:**
- Verifique se o hook `useGreenNAuth` está sendo usado
- Confirme se os dados estão sendo carregados do Firestore

**3. Funcionalidades não são controladas:**
- Verifique se o `hasFeatureAccess` está sendo usado nos componentes
- Confirme se as funcionalidades estão mapeadas corretamente

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs do console** para erros
2. **Confirme as chaves** estão corretas
3. **Teste a API** da GreenN diretamente
4. **Entre em contato** com o suporte da GreenN

---

**🎯 Com essas configurações, a integração estará funcionando perfeitamente!**
