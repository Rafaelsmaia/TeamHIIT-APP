# 🔐 Como Configurar os Secrets

## Opção 1: Via Terminal (Mais Confiável) ✅

Execute estes comandos no PowerShell (um por vez):

```powershell
# 1. Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
# Quando aparecer "Enter a value for GEMINI_API_KEY:", cole:
AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ
# Pressione Enter

# 2. FatSecret Consumer Key
firebase functions:secrets:set FATSECRET_CONSUMER_KEY
# Quando aparecer "Enter a value for FATSECRET_CONSUMER_KEY:", cole:
4cf5b8d0cc5648fb84fd0790a664d7f6
# Pressione Enter

# 3. FatSecret Consumer Secret
firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
# Quando aparecer "Enter a value for FATSECRET_CONSUMER_SECRET:", cole:
f0fea149c98e43f0bc39abecf45a9c8b
# Pressione Enter
```

## Opção 2: Via Firebase Console

1. Na página de **Functions** onde você está
2. Procure por uma **aba "Secrets"** ao lado de "Painel" e "Uso"
3. Se não aparecer, pode estar em:
   - **Configurações do Projeto** (ícone ⚙️ no topo)
   - Ou no **Google Cloud Console**: https://console.cloud.google.com/
     - Vá em **Cloud Functions** > **Secrets**

## Depois de Configurar

Faça o deploy:

```powershell
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

## Verificar se Funcionou

Após o deploy, teste a calculadora de calorias no app. Se der erro, verifique os logs:

```powershell
firebase functions:log --only calculateCalories
```






