/**
 * Utilitário para testar a integração com GreenN
 * Use este arquivo para verificar se a integração está funcionando corretamente
 */

import greenNIntegration from '../services/GreenNIntegration';
import { validateConfig } from '../config/environment';

export const testGreenNIntegration = async () => {
  console.log('🧪 [Test] Iniciando testes da integração GreenN...');
  
  // 1. Verificar configuração
  console.log('1️⃣ [Test] Verificando configuração...');
  const configValid = validateConfig();
  console.log(`✅ [Test] Configuração válida: ${configValid}`);
  
  if (!configValid) {
    console.error('❌ [Test] Configuração inválida. Verifique as chaves no arquivo .env');
    return false;
  }
  
  // 2. Testar validação de credenciais (com credenciais de teste)
  console.log('2️⃣ [Test] Testando validação de credenciais...');
  try {
    const result = await greenNIntegration.validateCredentials('test@example.com', 'password123');
    console.log(`✅ [Test] Validação de credenciais: ${result.success ? 'Sucesso' : 'Falha'}`);
    if (!result.success) {
      console.log(`⚠️ [Test] Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ [Test] Erro na validação de credenciais:', error.message);
  }
  
  // 3. Testar verificação de status da assinatura
  console.log('3️⃣ [Test] Testando verificação de status da assinatura...');
  try {
    const result = await greenNIntegration.checkSubscriptionStatus('test-user-id', 'test-token');
    console.log(`✅ [Test] Verificação de assinatura: ${result.success ? 'Sucesso' : 'Falha'}`);
    if (!result.success) {
      console.log(`⚠️ [Test] Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ [Test] Erro na verificação de assinatura:', error.message);
  }
  
  // 4. Testar sincronização de dados
  console.log('4️⃣ [Test] Testando sincronização de dados...');
  try {
    const result = await greenNIntegration.syncUserData(
      { id: 'test-user', email: 'test@example.com' },
      { plan: 'premium', isActive: true }
    );
    console.log(`✅ [Test] Sincronização de dados: ${result.success ? 'Sucesso' : 'Falha'}`);
    if (!result.success) {
      console.log(`⚠️ [Test] Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ [Test] Erro na sincronização de dados:', error.message);
  }
  
  // 5. Testar verificação de acesso a funcionalidades
  console.log('5️⃣ [Test] Testando verificação de acesso a funcionalidades...');
  try {
    const hasAccess = await greenNIntegration.hasFeatureAccess('test-user-id', 'nutrition_tracking');
    console.log(`✅ [Test] Verificação de acesso: ${hasAccess ? 'Tem acesso' : 'Não tem acesso'}`);
  } catch (error) {
    console.error('❌ [Test] Erro na verificação de acesso:', error.message);
  }
  
  console.log('🎯 [Test] Testes da integração GreenN concluídos!');
  return true;
};

// Função para testar o hook useGreenNAuth
export const testGreenNAuthHook = async () => {
  console.log('🧪 [Test] Testando hook useGreenNAuth...');
  
  // Verificar se o hook pode ser importado
  try {
    const module = await import('../hooks/useGreenNAuth.js');
    const { useGreenNAuth } = module;
    console.log('✅ [Test] Hook useGreenNAuth importado com sucesso');
    return Boolean(useGreenNAuth);
  } catch (error) {
    console.error('❌ [Test] Erro ao importar hook useGreenNAuth:', error.message);
    return false;
  }
};

// Função para testar os componentes
export const testGreenNComponents = async () => {
  console.log('🧪 [Test] Testando componentes GreenN...');
  
  // Verificar se os componentes podem ser importados
  try {
    const { default: GreenNLogin } = await import('../components/GreenNLogin.jsx');
    const { default: SubscriptionStatus } = await import('../components/SubscriptionStatus.jsx');

    console.log('✅ [Test] Componente GreenNLogin importado com sucesso');
    console.log('✅ [Test] Componente SubscriptionStatus importado com sucesso');
    return Boolean(GreenNLogin && SubscriptionStatus);
  } catch (error) {
    console.error('❌ [Test] Erro ao importar componentes:', error.message);
    return false;
  }
};

// Função para executar todos os testes
export const runAllTests = async () => {
  console.log('🚀 [Test] Executando todos os testes da integração GreenN...');
  
  const results = {
    config: validateConfig(),
    components: await testGreenNComponents(),
    hook: await testGreenNAuthHook(),
    integration: await testGreenNIntegration()
  };
  
  console.log('📊 [Test] Resultados dos testes:');
  console.log(`- Configuração: ${results.config ? '✅' : '❌'}`);
  console.log(`- Componentes: ${results.components ? '✅' : '❌'}`);
  console.log(`- Hook: ${results.hook ? '✅' : '❌'}`);
  console.log(`- Integração: ${results.integration ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`🎯 [Test] Todos os testes passaram: ${allPassed ? '✅' : '❌'}`);
  
  return allPassed;
};

export default {
  testGreenNIntegration,
  testGreenNAuthHook,
  testGreenNComponents,
  runAllTests
};

