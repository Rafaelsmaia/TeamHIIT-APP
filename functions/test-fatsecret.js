/**
 * Script para testar a integração com FatSecret API
 */

const axios = require('axios');
const crypto = require('crypto');

const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';

// Credenciais do FatSecret
const CONSUMER_KEY = '4cf5b8d0cc5648fb84fd0790a664d7f6';
const CONSUMER_SECRET = 'b9f6c33f92634b5eb8b5066a9c56ef1c';

/**
 * Gera assinatura OAuth 1.0
 */
function generateOAuthSignature(method, url, params, consumerSecret) {
  // Ordenar parâmetros
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Criar string de assinatura
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  // Gerar assinatura HMAC-SHA1
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

/**
 * Testar busca no FatSecret
 */
async function testFatSecretSearch(foodName) {
  try {
    console.log(`\n🔍 Testando busca para: "${foodName}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const searchParams = {
      method: 'foods.search',
      search_expression: foodName,
      format: 'json',
      oauth_consumer_key: CONSUMER_KEY,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
    };

    // Gerar assinatura
    searchParams.oauth_signature = generateOAuthSignature(
      'GET',
      FATSECRET_API_URL,
      searchParams,
      CONSUMER_SECRET
    );

    console.log('📤 Enviando requisição...');
    const response = await axios.get(FATSECRET_API_URL, {
      params: searchParams,
    });

    console.log('✅ Resposta recebida!\n');
    
    // Verificar se há resultados
    const foods = response.data?.foods?.food || [];
    
    if (response.data?.error) {
      console.error('❌ Erro da API:', response.data.error);
      return false;
    }
    
    if (foods.length === 0) {
      console.warn('⚠️  Nenhum alimento encontrado');
      return false;
    }

    console.log(`📋 Encontrados ${Array.isArray(foods) ? foods.length : 1} resultados:\n`);
    
    // Mostrar primeiros 3 resultados
    const foodList = Array.isArray(foods) ? foods.slice(0, 3) : [foods];
    foodList.forEach((food, index) => {
      console.log(`${index + 1}. ${food.food_name}`);
      console.log(`   ID: ${food.food_id}`);
      console.log(`   Descrição: ${food.food_description || 'N/A'}`);
      console.log('');
    });

    // Testar busca detalhada do primeiro
    const firstFood = Array.isArray(foods) ? foods[0] : foods;
    console.log(`\n🔍 Buscando detalhes de: "${firstFood.food_name}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const nutritionParams = {
      method: 'food.get.v3',
      food_id: firstFood.food_id,
      format: 'json',
      oauth_consumer_key: CONSUMER_KEY,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
    };

    nutritionParams.oauth_signature = generateOAuthSignature(
      'GET',
      FATSECRET_API_URL,
      nutritionParams,
      CONSUMER_SECRET
    );

    const nutritionResponse = await axios.get(FATSECRET_API_URL, {
      params: nutritionParams,
    });

    const foodData = nutritionResponse.data?.food;
    if (!foodData) {
      console.error('❌ Não foi possível obter detalhes nutricionais');
      return false;
    }

    console.log('✅ Detalhes nutricionais obtidos!\n');
    console.log(`📊 ${foodData.food_name}`);
    
    const servings = foodData.servings?.serving || [];
    const serving = Array.isArray(servings) ? servings[0] : servings;
    
    if (serving) {
      console.log('\n📏 Porção padrão:');
      console.log(`   Tamanho: ${serving.metric_serving_amount || serving.serving_size}g`);
      console.log(`   Calorias: ${serving.calories} kcal`);
      console.log(`   Proteínas: ${serving.protein}g`);
      console.log(`   Carboidratos: ${serving.carbohydrate}g`);
      console.log(`   Gorduras: ${serving.fat}g`);
    }

    return true;
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('📋 Resposta do erro:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Executar testes
 */
async function runTests() {
  console.log('\n🧪 TESTE DA INTEGRAÇÃO FATSECRET API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔑 Consumer Key:', CONSUMER_KEY.substring(0, 10) + '...');
  console.log('🔐 Consumer Secret:', CONSUMER_SECRET.substring(0, 10) + '...\n');

  const testFoods = [
    'chicken breast',
    'white rice',
    'banana',
    'pão francês'
  ];

  let passed = 0;
  let failed = 0;

  for (const food of testFoods) {
    const success = await testFatSecretSearch(food);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`   ✅ Sucesso: ${passed}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram! A integração está funcionando.\n');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.\n');
  }
}

runTests().catch(console.error);

