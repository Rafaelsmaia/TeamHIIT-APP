Write-Host "Fazendo deploy da função calculateCalories..." -ForegroundColor Cyan
firebase deploy --only functions:calculateCalories
Write-Host "`nDeploy concluído!" -ForegroundColor Green

