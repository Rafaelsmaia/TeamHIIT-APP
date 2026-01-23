# 🔍 Como Verificar Qual Versão Está Rodando

## Problema

O resultado ainda mostra `labels: Array(5)`, indicando versão antiga.

## Verificações

### 1. Verificar Logs no Firebase Console

Acesse diretamente:
- https://console.firebase.google.com/project/comunidade-team-hiit/functions/logs
- Ou: Functions > calculateCalories > Logs

Procure por mensagens recentes:
- ✅ **Nova versão**: `"Iniciando análise da imagem com Gemini + FatSecret..."`
- ❌ **Versão antiga**: `"Iniciando análise da imagem com Edamam..."` ou `"identificados pelo Clarifai"`

### 2. Testar a Função Diretamente

Faça um teste e verifique os logs em tempo real:

1. Abra o Firebase Console > Functions > calculateCalories > Logs
2. Faça um teste no app (tire uma foto)
3. Veja os logs aparecerem em tempo real

### 3. Verificar Código Deployado

O código local está correto e **NÃO retorna `labels`**. Se você ainda vê `labels`, significa que:

1. O deploy não foi concluído
2. Há cache do Cloud Functions
3. A função está usando uma versão antiga

### 4. Forçar Novo Deploy

```bash
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

Aguarde a mensagem de sucesso e depois teste novamente.

### 5. Verificar Secrets

Se os secrets não estiverem configurados, a função pode estar falhando silenciosamente:

```bash
# Verificar se os secrets existem
firebase functions:secrets:access GEMINI_API_KEY
firebase functions:secrets:access FATSECRET_CONSUMER_KEY  
firebase functions:secrets:access FATSECRET_CONSUMER_SECRET
```

## Solução Rápida

1. **Acesse o Firebase Console**
2. **Vá em Functions > calculateCalories**
3. **Veja a data da última atualização**
4. **Se não for recente, faça o deploy novamente**

## Código Local (Correto)

O código em `functions/src/calorieCalculator.js` linha 343-353 retorna:

```javascript
{
  success: true,
  foods: [...],
  nutrition: {...}
  // SEM "labels"
}
```

Se você vê `labels`, a versão deployada é antiga.






