# Script para configurar secrets do Firebase Functions
# Execute: .\scripts\configurar-secrets.ps1

Write-Host "🔐 Configurando secrets do Firebase Functions..." -ForegroundColor Cyan

# Credenciais
$GEMINI_API_KEY = "AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ"
$FATSECRET_CONSUMER_KEY = "4cf5b8d0cc5648fb84fd0790a664d7f6"
$FATSECRET_CONSUMER_SECRET = "f0fea149c98e43f0bc39abecf45a9c8b"

Write-Host "`n1. Configurando GEMINI_API_KEY..." -ForegroundColor Yellow
echo $GEMINI_API_KEY | firebase functions:secrets:set GEMINI_API_KEY

Write-Host "`n2. Configurando FATSECRET_CONSUMER_KEY..." -ForegroundColor Yellow
echo $FATSECRET_CONSUMER_KEY | firebase functions:secrets:set FATSECRET_CONSUMER_KEY

Write-Host "`n3. Configurando FATSECRET_CONSUMER_SECRET..." -ForegroundColor Yellow
echo $FATSECRET_CONSUMER_SECRET | firebase functions:secrets:set FATSECRET_CONSUMER_SECRET

Write-Host "`n✅ Secrets configurados com sucesso!" -ForegroundColor Green
Write-Host "`nPróximo passo: Execute 'firebase deploy --only functions:calculateCalories'" -ForegroundColor Cyan


