# Guia: Como Compartilhar o Repositório com Freelancers

## 📋 Passo a Passo

### 1️⃣ Criar Repositório no GitHub (se ainda não existir)

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Preencha:
   - **Repository name**: `TeamHIIT-APP` (ou outro nome de sua preferência)
   - **Description**: "Aplicativo Team HIIT - Mobile App"
   - **Visibility**: 
     - ✅ **Private** (recomendado para proteger o código)
     - ⚠️ **Public** (se quiser que seja público)
   - **NÃO marque** "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

### 2️⃣ Conectar o Projeto Local ao GitHub

Abra o terminal na pasta do projeto e execute:

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit - Team HIIT App"

# Adicionar o repositório remoto (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/TeamHIIT-APP.git

# Enviar código para o GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ Adicionar Colaboradores (Freelancers)

1. No repositório do GitHub, clique em **"Settings"** (Configurações)
2. No menu lateral, clique em **"Collaborators"** (Colaboradores)
3. Clique em **"Add people"**
4. Digite o **email ou username do GitHub** do freelancer
5. Selecione o nível de permissão:
   - **Read** (apenas leitura) - Recomendado para avaliação
   - **Write** (pode fazer commits)
   - **Admin** (acesso total)
6. Clique em **"Add [nome] to this repository"**
7. O freelancer receberá um email de convite
8. Repita o processo para o segundo freelancer

### 4️⃣ Enviar os Links para os Freelancers

Envie para cada freelancer:
- **Link do repositório**: `https://github.com/SEU_USUARIO/TeamHIIT-APP`
- **Instrução**: "Aceite o convite que foi enviado por email"

---

## 🔒 Alternativa: Repositório Temporário Privado

Se preferir criar um repositório temporário apenas para avaliação:

1. Crie um repositório privado com nome diferente (ex: `TeamHIIT-APP-Review`)
2. Adicione os freelancers como colaboradores
3. Após a avaliação, você pode:
   - Deletar o repositório temporário
   - Ou mantê-lo como backup

---

## ⚠️ Importante: Arquivos Sensíveis

**ANTES de fazer push, verifique se você tem um arquivo `.gitignore`** que exclui:

- `serviceAccountKey.json` (chaves do Firebase)
- `.env` (variáveis de ambiente)
- `node_modules/`
- Arquivos de build
- Credenciais e senhas

Se não tiver `.gitignore`, posso criar um para você!

---

## 📝 Checklist

- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] `.gitignore` configurado (proteger credenciais)
- [ ] Colaboradores adicionados
- [ ] Links enviados para os freelancers

---

## 🆘 Precisa de Ajuda?

Se precisar, posso:
1. Criar um arquivo `.gitignore` adequado
2. Verificar se há arquivos sensíveis que não devem ser compartilhados
3. Ajudar com os comandos Git
