# 🔐 Configurar Secrets via Firebase Console

## Método Recomendado: Firebase Console

Como o comando `firebase functions:secrets:list` não está disponível, vamos usar o Firebase Console:

### Passo 1: Acessar o Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá em **Functions** (no menu lateral)
4. Clique na aba **Secrets**

### Passo 2: Adicionar os Secrets

Clique em **"Add secret"** e adicione cada um:

#### 1. GEMINI_API_KEY
- **Nome**: `GEMINI_API_KEY`
- **Valor**: `AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ`

#### 2. FATSECRET_CONSUMER_KEY
- **Nome**: `FATSECRET_CONSUMER_KEY`
- **Valor**: `4cf5b8d0cc5648fb84fd0790a664d7f6`

#### 3. FATSECRET_CONSUMER_SECRET
- **Nome**: `FATSECRET_CONSUMER_SECRET`
- **Valor**: `f0fea149c98e43f0bc39abecf45a9c8b`

### Passo 3: Fazer Deploy

Após adicionar os secrets, faça o deploy:

```bash
cd functions
npm install
firebase deploy --only functions:calculateCalories
```

## Alternativa: Via Terminal (se disponível)

Se o comando `firebase functions:secrets:set` estiver disponível:

```bash
# No PowerShell, execute um por vez:
firebase functions:secrets:set GEMINI_API_KEY
# Cole: AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ
# Pressione Enter

firebase functions:secrets:set FATSECRET_CONSUMER_KEY
# Cole: 4cf5b8d0cc5648fb84fd0790a664d7f6
# Pressione Enter

firebase functions:secrets:set FATSECRET_CONSUMER_SECRET
# Cole: f0fea149c98e43f0bc39abecf45a9c8b
# Pressione Enter
```

## Verificar Secrets Configurados

No Firebase Console, vá em **Functions > Secrets** e verifique se os 3 secrets aparecem listados.

## Pronto! 🎉

Após configurar os secrets e fazer o deploy, sua calculadora estará funcionando!


