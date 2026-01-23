# Configuração do Gemini + FatSecret para Calculadora de Calorias

Este documento explica como configurar o Google Gemini API e FatSecret API para a calculadora de calorias, similar ao Calorify.

## Visão Geral

A calculadora de calorias agora usa:
- **Google Gemini API**: Para reconhecimento de alimentos e porções em imagens
- **FatSecret API**: Para buscar informações nutricionais detalhadas dos alimentos identificados

## Passo 1: Obter Credenciais do Google Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key" ou acesse [API Keys](https://aistudio.google.com/app/apikey)
4. Clique em "Create API Key"
5. Selecione um projeto existente ou crie um novo
6. Copie a **API Key** gerada

### Limites e Custos:
- **Gemini 2.0 Flash**: ~$0.005 por imagem (recomendado)
- **Gemini 2.5 Pro**: ~$0.01-0.02 por imagem (mais preciso)
- Sem limite de requisições no plano gratuito inicial (com limites de rate)

## Passo 2: Obter Credenciais do FatSecret

1. Acesse [FatSecret Platform](https://platform.fatsecret.com/)
2. Clique em "Sign Up" ou faça login
3. Vá para "My Apps" > "Create New App"
4. Preencha os dados:
   - **App Name**: Ex: "TeamHIIT Calorie Calculator"
   - **Description**: Descrição do seu app
   - **Callback URL**: `https://your-domain.com/callback` (pode ser qualquer URL válida)
5. Após criar, você verá:
   - **Consumer Key** (é o FATSECRET_CONSUMER_KEY)
   - **Consumer Secret** (é o FATSECRET_CONSUMER_SECRET)

### Planos do FatSecret:
- **Edição Básica (Gratuita)**: 5.000 chamadas/dia (150.000/mês)
- **Edição Premier (Gratuita para Startups/NPOs)**: Ilimitado (com verificação)

## Passo 3: Configurar Secrets no Firebase Functions

### Opção 1: Usando Firebase CLI

```bash
# Configurar secrets
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set FATSECRET_CONSUMER_KEY
firebase functions:secrets:set FATSECRET_CONSUMER_SECRET

# Quando solicitado, cole o valor correspondente:
# - GEMINI_API_KEY: Sua API Key do Google Gemini
# - FATSECRET_CONSUMER_KEY: Seu Consumer Key do FatSecret
# - FATSECRET_CONSUMER_SECRET: Seu Consumer Secret do FatSecret
```

### Opção 2: Usando Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para "Functions" > "Secrets"
4. Clique em "Add secret" e adicione:
   - `GEMINI_API_KEY`
   - `FATSECRET_CONSUMER_KEY`
   - `FATSECRET_CONSUMER_SECRET`

## Passo 4: Instalar Dependências

```bash
cd functions
npm install
```

As dependências necessárias já estão no `package.json`:
- `axios`: Para fazer requisições HTTP
- `crypto`: Para assinatura OAuth 1.0 do FatSecret (já incluído no Node.js)

## Passo 5: Fazer Deploy das Functions

```bash
firebase deploy --only functions:calculateCalories
```

## Como Funciona

1. **Reconhecimento de Imagem (Gemini)**:
   - A imagem é enviada para o Gemini 2.0 Flash
   - O modelo identifica alimentos e estima porções
   - Retorna uma lista de alimentos com quantidades em gramas

2. **Busca Nutricional (FatSecret)**:
   - Para cada alimento identificado, busca no banco do FatSecret
   - Obtém valores nutricionais detalhados
   - Calcula valores baseado na quantidade estimada pelo Gemini

3. **Cálculo dos Totais**:
   - Soma as calorias e macros de todos os alimentos
   - Exibe o resultado na interface

## Vantagens desta Solução

✅ **Identifica porções automaticamente** (Gemini estima quantidades)  
✅ **Custo baixo**: ~$0.50-5.00/mês para uso moderado  
✅ **FatSecret gratuito** até 150k requisições/mês  
✅ **Precisão alta** similar ao Calorify  
✅ **Preços transparentes** e escaláveis  

## Troubleshooting

### Erro: "Gemini API Key não configurada"
- Verifique se o secret `GEMINI_API_KEY` foi configurado
- Certifique-se de que o nome está correto (case-sensitive)
- Faça o deploy novamente após configurar

### Erro: "FatSecret credentials não configuradas"
- Verifique se `FATSECRET_CONSUMER_KEY` e `FATSECRET_CONSUMER_SECRET` foram configurados
- Certifique-se de que os nomes estão corretos (case-sensitive)
- Faça o deploy novamente após configurar

### Erro: "Nenhum alimento foi identificado na imagem"
- Verifique se a GEMINI_API_KEY está configurada corretamente
- Tente uma imagem com melhor iluminação
- Certifique-se de que a imagem mostra alimentos claramente

### Erro: "Rate limit exceeded"
- Você atingiu o limite de requisições do FatSecret (5k/dia no plano básico)
- Considere fazer upgrade para o plano Premier (gratuito para startups)
- Implemente cache para reduzir requisições

### Erro OAuth do FatSecret
- Verifique se o Consumer Key e Consumer Secret estão corretos
- Certifique-se de que o app foi criado corretamente no FatSecret Platform
- Verifique se o formato da assinatura OAuth está correto

## Comparação de Custos

| Volume | Gemini Flash + FatSecret | Clarifai + Edamam |
|--------|-------------------------|-------------------|
| 100 imagens/mês | ~$0.50 | $14-69/mês |
| 500 imagens/mês | ~$2.50 | $14-69/mês |
| 1.000 imagens/mês | ~$5.00 | $14-69/mês |

**Economia**: De $14-69/mês para ~$0.50-5.00/mês! 💰

## Referências

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [FatSecret API Documentation](https://platform.fatsecret.com/api/)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)
- [Calorify - Exemplo de implementação](https://ai.google.dev/competition/projects/calorify-ai-calorie-scanner)


