import { execSync } from 'child_process';
import { existsSync, unlinkSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const buildsDir = join(rootDir, 'builds');
const aabSource = join(rootDir, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const aabDest = join(buildsDir, 'TeamHIIT-release.aab');

console.log('🔨 Iniciando build do AAB (Android App Bundle)...\n');

try {
  // 1. Build do projeto
  console.log('📦 Fazendo build do projeto...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Sincronizar com Capacitor
  console.log('\n🔄 Sincronizando com Capacitor...');
  execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

  // 3. Gerar AAB
  console.log('\n🤖 Gerando AAB (Android App Bundle)...');
  const isWindows = process.platform === 'win32';
  const gradlewCommand = isWindows ? 'gradlew.bat' : './gradlew';
  execSync(`${gradlewCommand} bundleRelease`, { cwd: join(rootDir, 'android'), stdio: 'inherit' });

  // 4. Criar pasta builds se não existir
  if (!existsSync(buildsDir)) {
    mkdirSync(buildsDir, { recursive: true });
  }

  // 5. Remover AAB antigo se existir
  if (existsSync(aabDest)) {
    console.log('\n🗑️  Removendo AAB antigo...');
    unlinkSync(aabDest);
  }

  // 6. Copiar novo AAB para builds
  console.log('\n📋 Copiando AAB para pasta builds...');
  copyFileSync(aabSource, aabDest);

  console.log('\n✅ AAB gerado com sucesso!');
  console.log(`📱 Localização: ${aabDest}`);
  console.log('\n📤 Próximo passo: Faça upload do AAB no Google Play Console\n');
} catch (error) {
  console.error('\n❌ Erro ao gerar AAB:', error.message);
  process.exit(1);
}

