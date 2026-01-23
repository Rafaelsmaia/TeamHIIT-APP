# ⚡ Configurar Secrets - Instruções Manuais

## Credenciais que você forneceu:

✅ **Gemini API Key**: `AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ`  
✅ **FatSecret Client ID**: `4cf5b8d0cc5648fb84fd0790a664d7f6`  
✅ **FatSecret Client Secret**: `f0fea149c98e43f0bc39abecf45a9c8b`

## Execute estes comandos no terminal (um por vez):

```bash
# 1. Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
# Cole quando solicitado: AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ
# Pressione Enter

# 2. FatSecret Consumer Key  
firebase functions:secrets:set FATSECRET_CONSUMER_KEY
# Cole quando solicitado: 4cf5b8d0cc5648fb84fd0790a664d7f6
# Pressione Enter

# 3. FatSecret Consumer Secret
firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
# Cole quando solicitado: f0fea149c98e43f0bc39abecf45a9c8b
# Pressione Enter
```

## Depois, faça o deploy:

```bash
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

## Pronto! 🎉


