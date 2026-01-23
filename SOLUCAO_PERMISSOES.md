# 🔧 Solução: Problema de Permissões no Cursor

## ❌ Problema Identificado

O Cursor está sendo executado **como administrador**, e o sistema de sandbox do Cursor **não permite** executar comandos quando o processo está elevado.

**Erro que aparece:**
```
Error: Failed to apply sandbox: Sandbox cannot run from an elevated administrator process. 
Please run Cursor without administrator privileges.
```

## ✅ Soluções

### Solução 1: Executar Cursor SEM Administrador (Recomendado)

1. **Feche o Cursor completamente**
2. **Abra o Cursor normalmente** (sem clicar com botão direito → "Executar como administrador")
3. Se você tem um atalho que sempre abre como admin, crie um novo atalho normal

**Como verificar se está como admin:**
- Se a barra de título do Cursor mostra "Administrador" ou tem um escudo, está como admin
- Se não mostra, está normal ✅

### Solução 2: Executar Scripts Manualmente no Terminal

Se preferir não fechar o Cursor, você pode executar os comandos diretamente no terminal:

#### Opção A: Usar o Script Node.js

Abra o **PowerShell** ou **Prompt de Comando** na pasta do projeto e execute:

```powershell
# Navegar para a pasta do projeto
cd "C:\Users\Rafael\Documents\GitHub\TeamHIIT - APP"

# Executar o script (já está configurado com seu username)
node scripts/push-to-github.js
```

#### Opção B: Usar o Script PowerShell

```powershell
# Navegar para a pasta do projeto
cd "C:\Users\Rafael\Documents\GitHub\TeamHIIT - APP"

# Executar o script PowerShell
.\scripts\push-to-github.ps1
```

#### Opção C: Comandos Git Manuais

Se os scripts não funcionarem, execute manualmente:

```powershell
# Navegar para a pasta do projeto
cd "C:\Users\Rafael\Documents\GitHub\TeamHIIT - APP"

# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit - Team HIIT App"

# Configurar branch main
git branch -M main

# Adicionar remote (já com seu username)
git remote add origin https://github.com/Rafaelsmaia/TeamHIIT-APP.git

# Fazer push
git push -u origin main
```

**Nota:** Se pedir credenciais:
- **Username**: `Rafaelsmaia`
- **Password**: Use um **Personal Access Token** (não sua senha do GitHub)
  - Como criar: https://github.com/settings/tokens
  - Permissões necessárias: `repo` (acesso completo aos repositórios)

### Solução 3: Usar GitHub Desktop ou Git GUI

Se preferir uma interface gráfica:

1. Instale o **GitHub Desktop**: https://desktop.github.com/
2. Abra o repositório local
3. Faça o commit e push pela interface

---

## 🎯 Recomendação

**A melhor solução é a Solução 1** (executar Cursor sem admin), pois:
- ✅ Permite que eu execute comandos para você
- ✅ Mais seguro (não precisa de privilégios elevados para desenvolvimento)
- ✅ Evita problemas futuros

**Se precisar de privilégios de admin para algo específico**, abra apenas o terminal/PowerShell como admin quando necessário, mas mantenha o Cursor normal.

---

## 📋 Checklist Rápido

- [ ] Fechar Cursor completamente
- [ ] Abrir Cursor normalmente (sem "Executar como administrador")
- [ ] Verificar se não aparece "Administrador" na barra de título
- [ ] Tentar executar comandos novamente

---

## ❓ Por que isso acontece?

O Cursor usa um sistema de **sandbox** (isolamento) para executar comandos de forma segura. Por questões de segurança, processos elevados (administrador) não podem usar o sandbox, pois isso poderia ser um risco de segurança.

**É uma proteção, não um bug!** 🛡️
