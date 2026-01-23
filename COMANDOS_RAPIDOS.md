# 🚀 Comandos Rápidos - Push para GitHub

## Execute estes comandos no PowerShell ou Prompt de Comando:

```powershell
# 1. Navegar para a pasta do projeto
cd "C:\Users\Rafael\Documents\GitHub\TeamHIIT - APP"

# 2. Inicializar Git (se ainda não foi feito)
git init

# 3. Adicionar todos os arquivos
git add .

# 4. Criar commit inicial
git commit -m "Initial commit - Team HIIT App"

# 5. Configurar branch main
git branch -M main

# 6. Adicionar remote (já com seu username)
git remote add origin https://github.com/Rafaelsmaia/TeamHIIT-APP.git

# 7. Fazer push
git push -u origin main
```

## ⚠️ Se pedir credenciais:

- **Username**: `Rafaelsmaia`
- **Password**: Use um **Personal Access Token**
  - Criar: https://github.com/settings/tokens
  - Permissões: Marque `repo` (acesso completo aos repositórios)
  - Copie o token e cole como senha

## 🎯 Ou execute o arquivo .bat:

Clique duas vezes em: **`EXECUTAR_AGORA.bat`** na pasta do projeto

---

**Depois do push, adicione os colaboradores:**
1. Acesse: https://github.com/Rafaelsmaia/TeamHIIT-APP
2. Settings → Collaborators → Add people
3. Adicione os 2 freelancers com permissão "Read"
