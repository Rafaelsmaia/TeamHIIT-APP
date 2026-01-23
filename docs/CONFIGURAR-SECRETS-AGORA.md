# ⚡ Configurar Secrets Agora

Você já tem as credenciais! Siga estes passos para configurar:

## Credenciais Fornecidas

✅ **Gemini API Key**: `AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ`  
✅ **FatSecret Client ID**: `4cf5b8d0cc5648fb84fd0790a664d7f6`  
✅ **FatSecret Client Secret**: `f0fea149c98e43f0bc39abecf45a9c8b`

## Passo 1: Configurar Secrets no Firebase

Execute os seguintes comandos no terminal (um de cada vez):

```bash
# 1. Configurar Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
# Quando solicitado, cole: AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ

# 2. Configurar FatSecret Consumer Key
firebase functions:secrets:set FATSECRET_CONSUMER_KEY
# Quando solicitado, cole: 4cf5b8d0cc5648fb84fd0790a664d7f6

# 3. Configurar FatSecret Consumer Secret
firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
# Quando solicitado, cole: f0fea149c98e43f0bc39abecf45a9c8b
```

## Passo 2: Verificar Instalação

```bash
cd functions
npm install
```

## Passo 3: Fazer Deploy

```bash
firebase deploy --only functions:calculateCalories
```

## Pronto! 🎉

Após o deploy, sua calculadora de calorias estará usando Gemini + FatSecret!


