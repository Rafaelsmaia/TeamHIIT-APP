# Script PowerShell para fazer push do código para GitHub
# Execute: .\scripts\push-to-github.ps1

$githubUser = "Rafaelsmaia"
$repoName = "TeamHIIT-APP"
$remoteUrl = "https://github.com/$githubUser/$repoName.git"

Write-Host "🚀 Preparando push para GitHub..." -ForegroundColor Cyan
Write-Host "📦 Repositório: $remoteUrl`n" -ForegroundColor Yellow

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado! Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se já existe .git
if (Test-Path ".git") {
    Write-Host "✅ Repositório Git já inicializado`n" -ForegroundColor Green
} else {
    Write-Host "1️⃣ Inicializando repositório Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repositório inicializado!`n" -ForegroundColor Green
}

# Verificar remote
Write-Host "2️⃣ Verificando remote origin..." -ForegroundColor Cyan
try {
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote -eq $remoteUrl) {
        Write-Host "✅ Remote origin já configurado corretamente`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Remote origin existe com URL diferente: $existingRemote" -ForegroundColor Yellow
        Write-Host "💡 Atualizando remote..." -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
        Write-Host "✅ Remote atualizado!`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   Adicionando remote origin..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
    Write-Host "✅ Remote adicionado!`n" -ForegroundColor Green
}

# Verificar status
Write-Host "3️⃣ Verificando status do repositório..." -ForegroundColor Cyan
$status = git status --short
if ($status) {
    Write-Host "📝 Arquivos para adicionar:`n" -ForegroundColor Yellow
    Write-Host $status
    Write-Host "`n4️⃣ Adicionando arquivos..." -ForegroundColor Cyan
    git add .
    Write-Host "✅ Arquivos adicionados!`n" -ForegroundColor Green
} else {
    Write-Host "✅ Nenhuma alteração pendente`n" -ForegroundColor Green
}

# Verificar se há commits
Write-Host "5️⃣ Verificando commits..." -ForegroundColor Cyan
try {
    git rev-parse --verify HEAD >$null 2>&1
    $hasCommits = $true
} catch {
    $hasCommits = $false
}

if (-not $hasCommits -or $status) {
    Write-Host "   Criando commit..." -ForegroundColor Yellow
    $commitMessage = if ($hasCommits) { "Update - Team HIIT App" } else { "Initial commit - Team HIIT App" }
    git commit -m $commitMessage
    Write-Host "✅ Commit criado!`n" -ForegroundColor Green
} else {
    Write-Host "✅ Já existe commit, pulando...`n" -ForegroundColor Green
}

# Configurar branch main
Write-Host "6️⃣ Configurando branch main..." -ForegroundColor Cyan
try {
    git branch -M main
    Write-Host "✅ Branch main configurada!`n" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Branch já configurada`n" -ForegroundColor Yellow
}

# Push
Write-Host "7️⃣ Fazendo push para GitHub...`n" -ForegroundColor Cyan
Write-Host "⚠️  Se pedir credenciais, use:" -ForegroundColor Yellow
Write-Host "   - Username: $githubUser" -ForegroundColor Yellow
Write-Host "   - Password: Use um Personal Access Token (não sua senha)" -ForegroundColor Yellow
Write-Host "   - Como criar token: https://github.com/settings/tokens`n" -ForegroundColor Yellow

try {
    git push -u origin main
    Write-Host "`n✅ Push concluído com sucesso!" -ForegroundColor Green
    Write-Host "`n🔗 Repositório: $remoteUrl" -ForegroundColor Cyan
    Write-Host "`n📋 Próximo passo: Adicione colaboradores no GitHub:" -ForegroundColor Yellow
    Write-Host "   Settings → Collaborators → Add people`n" -ForegroundColor Yellow
} catch {
    Write-Host "`n❌ Erro ao fazer push." -ForegroundColor Red
    Write-Host "`n💡 Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "   1. Configure credenciais Git:" -ForegroundColor White
    Write-Host "      git config --global user.name `"Seu Nome`"" -ForegroundColor Gray
    Write-Host "      git config --global user.email `"seu@email.com`"" -ForegroundColor Gray
    Write-Host "`n   2. Use Personal Access Token como senha:" -ForegroundColor White
    Write-Host "      https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "`n   3. Ou use GitHub CLI:" -ForegroundColor White
    Write-Host "      gh auth login" -ForegroundColor Gray
}
