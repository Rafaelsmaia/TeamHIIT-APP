# 📚 Instruções Completas para Compartilhar no GitHub

## ✅ O que já foi feito automaticamente:

1. ✅ Scripts de automação criados
2. ✅ README.md criado
3. ✅ Verificação de segurança (.gitignore já protege arquivos sensíveis)

## 🚀 Passo a Passo Rápido

### 1️⃣ Criar Repositório no GitHub

1. Acesse: **https://github.com/new**
2. Preencha:
   - **Repository name**: `TeamHIIT-APP` (ou outro nome)
   - **Description**: "Aplicativo Team HIIT - Mobile App"
   - **Visibility**: ✅ **Private** (recomendado)
   - ❌ **NÃO marque** "Add a README file" (já temos)
3. Clique em **"Create repository"**

### 2️⃣ Executar Scripts (Escolha uma opção)

#### Opção A: Script Automático (Recomendado)

```bash
# 1. Configurar Git (se ainda não foi feito)
node scripts/setup-git-repo.js

# 2. Fazer push (substitua SEU_USUARIO pelo seu username do GitHub)
node scripts/push-to-github.js SEU_USUARIO
```

**Exemplo:**
```bash
node scripts/push-to-github.js rafael-maia
```

#### Opção B: Comandos Manuais

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit - Team HIIT App"

# Configurar branch main
git branch -M main

# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/TeamHIIT-APP.git

# Fazer push
git push -u origin main
```

### 3️⃣ Adicionar Colaboradores (Freelancers)

1. No repositório do GitHub, clique em **"Settings"**
2. No menu lateral, clique em **"Collaborators"**
3. Clique em **"Add people"**
4. Digite o **email ou username do GitHub** do freelancer
5. Selecione permissão: **Read** (apenas leitura para avaliação)
6. Clique em **"Add [nome] to this repository"**
7. Repita para o segundo freelancer

### 4️⃣ Enviar Informações aos Freelancers

Envie para cada freelancer:
- **Link do repositório**: `https://github.com/SEU_USUARIO/TeamHIIT-APP`
- **Mensagem**: "Aceite o convite que foi enviado por email para ter acesso ao repositório"

---

## 🔒 Segurança Verificada

✅ Os seguintes arquivos estão protegidos e **NÃO** serão enviados:
- `serviceAccountKey.json` (chaves do Firebase)
- `.env` e variantes (variáveis de ambiente)
- `node_modules/` (dependências)
- Arquivos de build (`.apk`, `.aab`)
- Logs e arquivos temporários

---

## ⚠️ Problemas Comuns

### Erro: "Repository not found"
- **Causa**: Repositório ainda não foi criado no GitHub
- **Solução**: Crie o repositório primeiro em https://github.com/new

### Erro: "Authentication failed"
- **Causa**: Problemas de autenticação
- **Solução**: 
  - Configure credenciais: `git config --global user.name "Seu Nome"`
  - Ou use GitHub CLI: `gh auth login`

### Erro: "Remote origin already exists"
- **Causa**: Remote já foi configurado anteriormente
- **Solução**: 
  ```bash
  git remote set-url origin https://github.com/SEU_USUARIO/TeamHIIT-APP.git
  ```

---

## 📞 Precisa de Ajuda?

Se encontrar problemas, verifique:
1. ✅ Repositório foi criado no GitHub?
2. ✅ Username está correto?
3. ✅ Tem permissões de escrita no repositório?
4. ✅ Git está configurado corretamente?

---

## 🎯 Checklist Final

- [ ] Repositório criado no GitHub (privado)
- [ ] Código enviado para o GitHub (via script ou manualmente)
- [ ] Colaboradores adicionados (2 freelancers)
- [ ] Links enviados para os freelancers
- [ ] Freelancers aceitaram os convites

---

**Pronto! Seu repositório está configurado e pronto para compartilhar! 🚀**
