/**
 * Teste da assinatura OAuth do FatSecret
 */

const axios = require('axios');
const crypto = require('crypto');

const CONSUMER_KEY = '4cf5b8d0cc5648fb84fd0790a664d7f6';
const CONSUMER_SECRET = 'b9f6c33f92634b5eb8b5066a9c56ef1c';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';

/**
 * Gera assinatura OAuth 1.0
 */
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret = "") {
  // Ordenar parâmetros
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");

  // Criar string de assinatura
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Gerar assinatura HMAC-SHA1
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");

  return signature;
}

async function testFatSecretOAuth() {
  console.log('\n🔐 TESTANDO ASSINATURA OAUTH DO FATSECRET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const searchParams = {
    method: "foods.search",
    search_expression: "chicken",
    format: "json",
    oauth_consumer_key: CONSUMER_KEY,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_version: "1.0",
  };

  // Gerar assinatura
  searchParams.oauth_signature = generateOAuthSignature(
    "GET",
    API_URL,
    searchParams,
    CONSUMER_SECRET
  );

  console.log('📋 Parâmetros da requisição:');
  console.log(`   Consumer Key: ${CONSUMER_KEY.substring(0, 20)}...`);
  console.log(`   Timestamp: ${searchParams.oauth_timestamp}`);
  console.log(`   Nonce: ${searchParams.oauth_nonce.substring(0, 10)}...`);
  console.log(`   Signature: ${searchParams.oauth_signature.substring(0, 20)}...\n`);

  try {
    console.log('📤 Enviando requisição...\n');
    
    const response = await axios.get(API_URL, {
      params: searchParams,
    });

    console.log('✅ SUCESSO!');
    console.log('📋 Resposta:', JSON.stringify(response.data).substring(0, 200) + '...\n');

    const foods = response.data?.foods?.food || [];
    if (foods.length > 0) {
      console.log(`🍗 ${foods.length} alimentos encontrados:`);
      foods.slice(0, 3).forEach((food, i) => {
        const foodName = Array.isArray(food) ? food[0].food_name : food.food_name;
        console.log(`   ${i + 1}. ${foodName}`);
      });
    }

    console.log('\n🎉 OAuth está funcionando corretamente!\n');
    return true;

  } catch (error) {
    console.error('❌ ERRO na requisição:');
    console.error('   Status:', error.response?.status);
    console.error('   Dados:', JSON.stringify(error.response?.data, null, 2));
    console.error('\n❌ OAuth NÃO está funcionando!\n');
    return false;
  }
}

testFatSecretOAuth();

