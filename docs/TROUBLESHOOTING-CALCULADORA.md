# Troubleshooting - Calculadora de Calorias (Gemini + FatSecret)

## Erro: CORS Policy / Failed to fetch

### Sintomas
```
Access to fetch at 'https://us-central1-comunidade-team-hiit.cloudfunctions.net/calculateCalories' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Soluções

#### 1. Verificar se a função foi deployada

```bash
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

#### 2. Verificar se a função está ativa

Acesse: https://console.firebase.google.com/project/comunidade-team-hiit/functions

Verifique se `calculateCalories` aparece na lista e está com status "Ativo".

#### 3. Testar a função diretamente

Você pode testar a função usando curl ou Postman:

```bash
curl -X POST https://us-central1-comunidade-team-hiit.cloudfunctions.net/calculateCalories \
  -H "Content-Type: application/json" \
  -d '{"image":"base64_encoded_image_here"}'
```

#### 4. Limpar cache do Service Worker

1. Abra DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Clique em **Unregister** para todos os service workers
4. Vá em **Application** > **Storage** > **Clear site data**
5. Recarregue a página (Ctrl+Shift+R)

#### 5. Verificar logs da função

```bash
cd functions
firebase functions:log --only calculateCalories
```

## Erro: Gemini API Key não configurada

### Solução

1. Verifique se o secret `GEMINI_API_KEY` foi configurado:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

2. Faça o deploy novamente após configurar:
   ```bash
   firebase deploy --only functions:calculateCalories
   ```

## Erro: FatSecret credentials não configuradas

### Solução

1. Configure os secrets do FatSecret:
   ```bash
   firebase functions:secrets:set FATSECRET_CONSUMER_KEY
   firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
   ```

2. Faça o deploy novamente após configurar

## Erro: Nenhum alimento foi identificado na imagem

### Soluções:

1. **Verifique a imagem**: Certifique-se de que a imagem mostra alimentos claramente
2. **Iluminação**: Tente uma foto com melhor iluminação
3. **Qualidade**: Use uma imagem de boa qualidade
4. **Verifique logs**: Veja os logs da função para mais detalhes

## Erro: Rate limit exceeded (FatSecret)

Você atingiu o limite de requisições do FatSecret (5.000/dia no plano básico).

### Soluções:
- Aguardar o próximo dia
- Fazer upgrade para o plano Premier (gratuito para startups)
- Implementar cache para reduzir requisições

## Erro: Rate limit exceeded (Gemini)

Você atingiu o limite de requisições do Gemini.

### Soluções:
- Verificar o plano do Google Cloud
- Aguardar o reset do limite
- Implementar cache para reduzir requisições

## Erro: Câmera não funciona

### Soluções:

1. **Permissões**: Verifique se o navegador tem permissão para acessar a câmera
2. **HTTPS**: A câmera só funciona em HTTPS (ou localhost)
3. **Outro app usando a câmera**: Feche outros apps que possam estar usando a câmera
4. **Tente câmera frontal**: O app tenta automaticamente a câmera frontal se a traseira falhar

## Teste Local (Emulador)

Para testar localmente sem fazer deploy:

```bash
cd functions
npm run serve
```

Isso iniciará o emulador em `http://localhost:5001`

Atualize o `CalorieCalculatorService.js` temporariamente:

```javascript
const FUNCTIONS_BASE_URL = 'http://localhost:5001/comunidade-team-hiit/us-central1';
```

## Verificar Status da Função

```bash
# Listar todas as funções
firebase functions:list

# Ver logs em tempo real
firebase functions:log --only calculateCalories --follow
```

## Contato

Se o problema persistir, verifique:
1. Logs do Firebase Functions
2. Console do navegador para erros detalhados
3. Network tab no DevTools para ver a requisição completa
4. Documentação: `docs/CONFIGURAR-GEMINI-FATSECRET.md`
