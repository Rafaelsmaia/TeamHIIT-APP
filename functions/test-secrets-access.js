/**
 * Teste de acesso às secrets do Firebase
 */

// Simular o carregamento das secrets da forma que a função faz
const { defineSecret } = require("firebase-functions/params");

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const fatSecretConsumerKey = defineSecret("FATSECRET_CONSUMER_KEY");
const fatSecretConsumerSecret = defineSecret("FATSECRET_CONSUMER_SECRET");

console.log("\n🔐 TESTANDO ACESSO ÀS SECRETS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

try {
  console.log("📋 Secrets definidas:");
  console.log(`   - GEMINI_API_KEY: ${typeof geminiApiKey}`);
  console.log(`   - FATSECRET_CONSUMER_KEY: ${typeof fatSecretConsumerKey}`);
  console.log(`   - FATSECRET_CONSUMER_SECRET: ${typeof fatSecretConsumerSecret}`);
  
  // Tentar acessar valores (não vai funcionar fora do Firebase Functions)
  console.log("\n⚠️  NOTA: Este teste NÃO pode acessar os valores das secrets");
  console.log("⚠️  As secrets só são acessíveis dentro do Firebase Functions");
  console.log("\n✅ As secrets estão DEFINIDAS corretamente no código!");
  
} catch (error) {
  console.error("\n❌ Erro ao definir secrets:", error.message);
}

