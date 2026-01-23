import { execSync } from 'child_process';
import { existsSync, unlinkSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const buildsDir = join(rootDir, 'builds');
const apkSource = join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

// Gerar nome único com data e hora
const now = new Date();
const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
const apkDest = join(buildsDir, `TeamHIIT-release-${dateStr}-${timeStr}.apk`);

console.log('🔨 Iniciando build do APK...\n');

try {
  // 1. Build do projeto
  console.log('📦 Fazendo build do projeto...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Sincronizar com Capacitor
  console.log('\n🔄 Sincronizando com Capacitor...');
  execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

  // 3. Gerar APK
  console.log('\n🤖 Gerando APK...');
  const isWindows = process.platform === 'win32';
  const gradlewCommand = isWindows ? 'gradlew.bat' : './gradlew';
  execSync(`${gradlewCommand} assembleRelease`, { cwd: join(rootDir, 'android'), stdio: 'inherit' });

  // 4. Criar pasta builds se não existir
  if (!existsSync(buildsDir)) {
    mkdirSync(buildsDir, { recursive: true });
  }

  // 5. Verificar se APK de origem existe
  if (!existsSync(apkSource)) {
    throw new Error(`APK de origem não encontrado: ${apkSource}`);
  }

  // 6. Copiar novo APK para builds com nome único
  console.log('\n📋 Copiando APK para pasta builds...');
  copyFileSync(apkSource, apkDest);

  console.log('\n✅ APK gerado com sucesso!');
  console.log(`📱 Localização: ${apkDest}\n`);
} catch (error) {
  console.error('\n❌ Erro ao gerar APK:', error.message);
  process.exit(1);
}

