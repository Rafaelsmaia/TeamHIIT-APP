#!/usr/bin/env node

/**
 * Script para fazer push do código para o GitHub
 * 
 * Uso: node scripts/push-to-github.js SEU_USUARIO [NOME_DO_REPO]
 * 
 * Exemplo: node scripts/push-to-github.js rafael-maia TeamHIIT-APP
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const githubUser = process.argv[2] || 'Rafaelsmaia';
const repoName = process.argv[3] || 'TeamHIIT-APP';

if (!githubUser) {
  console.error('❌ Erro: Username do GitHub é obrigatório!');
  console.log('\n📋 Uso: node scripts/push-to-github.js SEU_USUARIO [NOME_DO_REPO]');
  console.log('   Exemplo: node scripts/push-to-github.js Rafaelsmaia TeamHIIT-APP\n');
  process.exit(1);
}

const remoteUrl = `https://github.com/${githubUser}/${repoName}.git`;

console.log('🚀 Preparando push para GitHub...\n');
console.log(`📦 Repositório: ${remoteUrl}\n`);

try {
  // Verificar se Git está inicializado
  if (!existsSync(join(projectRoot, '.git'))) {
    console.log('⚠️  Repositório Git não inicializado. Inicializando...');
    execSync('git init', { stdio: 'inherit', cwd: projectRoot });
  }

  // Verificar se já existe remote
  try {
    const existingRemote = execSync('git remote get-url origin', { 
      encoding: 'utf-8', 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    if (existingRemote.trim() !== remoteUrl) {
      console.log('⚠️  Remote origin já existe com URL diferente:');
      console.log(`   ${existingRemote.trim()}`);
      console.log(`\n💡 Para alterar, execute:`);
      console.log(`   git remote set-url origin ${remoteUrl}\n`);
      process.exit(1);
    } else {
      console.log('✅ Remote origin já configurado corretamente\n');
    }
  } catch (error) {
    // Remote não existe, vamos adicionar
    console.log('1️⃣ Adicionando remote origin...');
    execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Remote adicionado!\n');
  }

  // Verificar status
  console.log('2️⃣ Verificando status do repositório...');
  const status = execSync('git status --short', { encoding: 'utf-8', cwd: projectRoot });
  
  if (status.trim()) {
    console.log('📝 Arquivos para adicionar:\n');
    console.log(status);
    console.log('\n3️⃣ Adicionando arquivos...');
    execSync('git add .', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Arquivos adicionados!\n');
  } else {
    console.log('✅ Nenhuma alteração pendente\n');
  }

  // Verificar se há commits
  let hasCommits = false;
  try {
    execSync('git rev-parse --verify HEAD', { 
      encoding: 'utf-8', 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    hasCommits = true;
  } catch (error) {
    hasCommits = false;
  }

  if (!hasCommits || status.trim()) {
    console.log('4️⃣ Criando commit...');
    const commitMessage = hasCommits 
      ? 'Update - Team HIIT App' 
      : 'Initial commit - Team HIIT App';
    
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Commit criado!\n');
  } else {
    console.log('✅ Já existe commit, pulando...\n');
  }

  // Configurar branch main
  console.log('5️⃣ Configurando branch main...');
  try {
    execSync('git branch -M main', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Branch main configurada!\n');
  } catch (error) {
    // Branch já existe ou já está em main
    console.log('ℹ️  Branch já configurada\n');
  }

  // Push
  console.log('6️⃣ Fazendo push para GitHub...');
  console.log('   ⚠️  Certifique-se de que o repositório já foi criado no GitHub!\n');
  
  try {
    execSync('git push -u origin main', { stdio: 'inherit', cwd: projectRoot });
    console.log('\n✅ Push concluído com sucesso!');
    console.log(`\n🔗 Repositório: ${remoteUrl}`);
    console.log('\n📋 Próximo passo: Adicione colaboradores no GitHub:');
    console.log('   Settings → Collaborators → Add people\n');
  } catch (error) {
    console.error('\n❌ Erro ao fazer push. Possíveis causas:');
    console.error('   1. Repositório ainda não foi criado no GitHub');
    console.error('   2. Problemas de autenticação (use GitHub CLI ou configure credenciais)');
    console.error('   3. Repositório remoto já tem commits diferentes\n');
    console.error('💡 Soluções:');
    console.error('   - Crie o repositório em: https://github.com/new');
    console.error('   - Ou use: gh auth login (se tiver GitHub CLI instalado)');
    console.error('   - Ou configure credenciais: git config --global user.name "Seu Nome"');
    console.error('                              git config --global user.email "seu@email.com"\n');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
}
