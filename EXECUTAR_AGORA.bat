@echo off
echo ========================================
echo   Push para GitHub - Team HIIT APP
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Verificando Git...
git --version
if errorlevel 1 (
    echo ERRO: Git nao encontrado! Instale o Git primeiro.
    pause
    exit /b 1
)
echo OK!
echo.

echo [2/6] Inicializando Git (se necessario)...
if not exist ".git" (
    git init
    echo OK!
) else (
    echo Git ja inicializado.
)
echo.

echo [3/6] Adicionando arquivos...
git add .
echo OK!
echo.

echo [4/6] Criando commit...
git commit -m "Initial commit - Team HIIT App" 2>nul
if errorlevel 1 (
    echo Aviso: Nenhuma alteracao para commitar ou commit ja existe.
) else (
    echo OK!
)
echo.

echo [5/6] Configurando branch main...
git branch -M main 2>nul
echo OK!
echo.

echo [6/6] Configurando remote e fazendo push...
git remote remove origin 2>nul
git remote add origin https://github.com/Rafaelsmaia/TeamHIIT-APP.git
echo.
echo Fazendo push para GitHub...
echo.
echo NOTA: Se pedir credenciais:
echo   - Username: Rafaelsmaia
echo   - Password: Use um Personal Access Token
echo   - Criar token: https://github.com/settings/tokens
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO ao fazer push!
    echo ========================================
    echo.
    echo Possiveis causas:
    echo   1. Repositorio ainda nao foi criado no GitHub
    echo   2. Problemas de autenticacao
    echo   3. Precisa configurar credenciais Git
    echo.
    echo Solucoes:
    echo   1. Crie o repositorio em: https://github.com/new
    echo   2. Configure Git: git config --global user.name "Seu Nome"
    echo                     git config --global user.email "seu@email.com"
    echo   3. Use Personal Access Token como senha
    echo.
) else (
    echo.
    echo ========================================
    echo   SUCESSO! Push concluido!
    echo ========================================
    echo.
    echo Repositorio: https://github.com/Rafaelsmaia/TeamHIIT-APP
    echo.
    echo Proximo passo: Adicione colaboradores no GitHub
    echo   Settings ^> Collaborators ^> Add people
    echo.
)

pause
