# 📋 Como Verificar se Está Usando a Nova Versão

## Passo a Passo:

### 1. Acessar os Logs

No Firebase Console, na página da função `calculateCalories`:

1. Clique na aba **"Logs"** (ao lado de "Painel", "Uso", etc.)
2. Ou acesse diretamente: https://console.firebase.google.com/project/comunidade-team-hiit/functions/logs?functionFilter=calculateCalories

### 2. Fazer um Teste

1. No app, vá para a Calculadora de Calorias
2. Tire uma foto ou selecione uma imagem
3. Clique em "Calcular Calorias"

### 3. Verificar os Logs

Nos logs, procure por estas mensagens:

#### ✅ **Nova Versão (Gemini + FatSecret):**
```
🔍 [CalorieCalculator] Iniciando análise da imagem com Gemini + FatSecret...
✅ [CalorieCalculator] X alimentos identificados pelo Gemini
✅ [CalorieCalculator] Análise concluída: X kcal
```

#### ❌ **Versão Antiga (Clarifai + Edamam):**
```
🔍 [CalorieCalculator] Iniciando análise da imagem com Edamam...
✅ [CalorieCalculator] X alimentos identificados pelo Clarifai
```

### 4. Verificar o Resultado

No console do navegador (F12), o resultado deve ser:

#### ✅ **Nova Versão:**
```javascript
{
  success: true,
  foods: Array(2),
  nutrition: {...}
  // ❌ SEM "labels"
}
```

#### ❌ **Versão Antiga:**
```javascript
{
  success: true,
  foods: Array(2),
  nutrition: {...},
  labels: Array(5)  // ❌ Isso indica versão antiga
}
```

## Se Ainda Ver "labels" ou Logs Antigos:

1. **Aguarde 2-3 minutos** (pode levar um pouco para propagar)
2. **Limpe o cache** do navegador (Ctrl+Shift+R)
3. **Teste novamente**
4. **Verifique os logs novamente**

## Se os Logs Mostrarem Erro:

Se aparecer erro sobre "Gemini API Key" ou "FatSecret", os secrets não estão configurados. Configure:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set FATSECRET_CONSUMER_KEY
firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
```






