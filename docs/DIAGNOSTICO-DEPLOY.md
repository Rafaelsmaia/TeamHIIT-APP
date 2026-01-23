# 🔍 Diagnóstico - Versão Antiga Ainda Rodando

## Problema Identificado

O resultado ainda mostra `labels: Array(5)`, o que indica que a versão antiga (Google Vision) ainda está em produção.

## Verificações Necessárias

### 1. Verificar se o Deploy Foi Concluído

Acesse o Firebase Console:
- https://console.firebase.google.com/project/comunidade-team-hiit/functions
- Procure pela função `calculateCalories`
- Verifique a data/hora da última atualização
- Deve ser recente (últimos minutos)

### 2. Verificar os Logs do Firebase Functions

Execute no terminal:
```bash
firebase functions:log --only calculateCalories --limit 10
```

**Logs Esperados (Nova Versão):**
- `🔍 [CalorieCalculator] Iniciando análise da imagem com Gemini + FatSecret...`
- `✅ [CalorieCalculator] X alimentos identificados pelo Gemini`

**Logs Antigos (Versão Antiga):**
- `🔍 [CalorieCalculator] Iniciando análise da imagem com Edamam...`
- `✅ [CalorieCalculator] X alimentos identificados pelo Clarifai`

### 3. Verificar se os Secrets Estão Configurados

Execute:
```bash
firebase functions:secrets:access GEMINI_API_KEY
firebase functions:secrets:access FATSECRET_CONSUMER_KEY
firebase functions:secrets:access FATSECRET_CONSUMER_SECRET
```

Se algum retornar erro, o secret não está configurado.

### 4. Forçar Novo Deploy

```bash
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

### 5. Limpar Cache e Testar

1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Limpe o Service Worker:
   - DevTools (F12) > Application > Service Workers > Unregister
   - Application > Storage > Clear site data
3. Teste novamente

## Se Ainda Não Funcionar

Pode ser que haja múltiplas versões da função ou cache do Cloud Functions. Tente:

1. **Deletar e Recriar a Função:**
   - No Firebase Console, delete a função `calculateCalories`
   - Faça o deploy novamente

2. **Verificar se há múltiplas regiões:**
   - Verifique se a função está deployada em `us-central1`
   - O código usa `region: "us-central1"` nas configurações globais

3. **Aguardar propagação:**
   - Pode levar 2-5 minutos para a nova versão estar totalmente ativa

## Resultado Esperado (Nova Versão)

```javascript
{
  success: true,
  foods: Array(2),  // Nomes dos alimentos
  nutrition: {
    totalCalories: 260,
    totalProtein: 5.4,
    totalCarbs: 56,
    totalFat: 0.6,
    foods: [...]  // Detalhes por alimento
  }
  // ❌ NÃO deve ter "labels"
}
```

## Resultado Atual (Versão Antiga)

```javascript
{
  success: true,
  foods: Array(2),
  nutrition: {...},
  labels: Array(5)  // ❌ Isso indica versão antiga
}
```






