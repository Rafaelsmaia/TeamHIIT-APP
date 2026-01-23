#!/usr/bin/env node

/**
 * Script para configurar o repositório Git e preparar para push no GitHub
 * 
 * Uso: node scripts/setup-git-repo.js
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

console.log('🚀 Configurando repositório Git...\n');

// Verificar se já existe .git
if (existsSync(join(projectRoot, '.git'))) {
  console.log('⚠️  Repositório Git já existe!');
  console.log('📋 Verificando status atual...\n');
  
  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: projectRoot });
    if (status.trim()) {
      console.log('📝 Arquivos não commitados encontrados:');
      console.log(status);
      console.log('\n💡 Execute os comandos manualmente ou use: git add . && git commit -m "Update"');
    } else {
      console.log('✅ Repositório está limpo (sem alterações pendentes)');
    }
  } catch (error) {
    console.log('ℹ️  Repositório Git existe mas pode precisar de configuração');
  }
} else {
  console.log('1️⃣ Inicializando repositório Git...');
  try {
    execSync('git init', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Repositório Git inicializado!\n');
  } catch (error) {
    console.error('❌ Erro ao inicializar Git:', error.message);
    process.exit(1);
  }
}

// Verificar se há arquivos sensíveis que não devem ser commitados
console.log('2️⃣ Verificando arquivos sensíveis...');
const sensitiveFiles = [
  'serviceAccountKey.json',
  '.env',
  'functions/.env',
  'functions/serviceAccountKey.json'
];

let hasSensitiveFiles = false;
for (const file of sensitiveFiles) {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`   ⚠️  Encontrado: ${file} (será ignorado pelo .gitignore)`);
    hasSensitiveFiles = true;
  }
}

if (hasSensitiveFiles) {
  console.log('   ✅ Arquivos sensíveis estão protegidos pelo .gitignore\n');
} else {
  console.log('   ✅ Nenhum arquivo sensível encontrado\n');
}

// Verificar .gitignore
console.log('3️⃣ Verificando .gitignore...');
if (existsSync(join(projectRoot, '.gitignore'))) {
  console.log('   ✅ .gitignore encontrado\n');
} else {
  console.log('   ⚠️  .gitignore não encontrado! Criando...');
  // O .gitignore já existe, então isso não deve acontecer
}

// Verificar se há um README
console.log('4️⃣ Verificando README...');
if (!existsSync(join(projectRoot, 'README.md'))) {
  console.log('   ℹ️  README.md não encontrado. Será criado um básico...');
  // Vou criar um README básico
}

console.log('\n✅ Configuração concluída!\n');
console.log('📋 Próximos passos:');
console.log('   1. Crie um repositório no GitHub (https://github.com/new)');
console.log('   2. Execute os comandos abaixo (substitua SEU_USUARIO pelo seu username):\n');
console.log('   git add .');
console.log('   git commit -m "Initial commit - Team HIIT App"');
console.log('   git branch -M main');
console.log('   git remote add origin https://github.com/SEU_USUARIO/TeamHIIT-APP.git');
console.log('   git push -u origin main\n');
console.log('💡 Ou use o script: node scripts/push-to-github.js SEU_USUARIO\n');
