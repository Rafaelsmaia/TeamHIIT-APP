# 🔄 Forçar Deploy da Nova Versão

## Problema

Os logs mostram que a versão antiga ainda está rodando, mesmo após o deploy.

## Solução: Deploy Forçado

### 1. Verificar Código Local

O código local está correto. Verifique se a primeira linha do log em `calorieCalculator.js` linha 265 diz:

```javascript
console.log("🔍 [CalorieCalculator] Iniciando análise da imagem com Gemini + FatSecret...");
```

### 2. Fazer Deploy Forçado

Execute estes comandos na ordem:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:calculateCalories --force
```

### 3. Verificar Deploy

No Firebase Console:
- Functions > calculateCalories
- Verifique a data/hora da última atualização
- Deve ser **agora**

### 4. Aguardar e Testar

1. Aguarde **5 minutos** (propagação do Cloud Functions)
2. Limpe o cache do navegador
3. Faça um novo teste
4. Verifique os logs

### 5. Se Ainda Não Funcionar

Pode ser necessário **deletar e recriar** a função:

1. No Firebase Console, delete a função `calculateCalories`
2. Faça o deploy novamente:
   ```bash
   firebase deploy --only functions:calculateCalories
   ```

## Logs Esperados (Nova Versão)

Quando funcionar, você verá:

```
🔍 [CalorieCalculator] Iniciando análise da imagem com Gemini + FatSecret...
✅ [CalorieCalculator] X alimentos identificados pelo Gemini
✅ [CalorieCalculator] Análise concluída: X kcal
```

**NÃO deve aparecer:**
- ❌ "labels detectados"
- ❌ "objetos detectados"






