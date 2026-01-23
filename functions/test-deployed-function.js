/**
 * Teste da função calculateCalories deployada
 */

const axios = require('axios');

// URL da função deployada
const FUNCTION_URL = 'https://calculatecalories-hdq6tjirga-uc.a.run.app';

// Imagem de teste pequena (1x1 pixel vermelho)
const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA';

async function testDeployedFunction() {
  console.log('\n🧪 TESTANDO FUNÇÃO DEPLOYADA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🌐 URL:', FUNCTION_URL);
  console.log('📤 Enviando requisição...\n');

  try {
    const response = await axios.post(
      FUNCTION_URL,
      {
        image: testImageBase64
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120s
      }
    );

    console.log('✅ Resposta recebida!\n');
    console.log('📋 Status:', response.status);
    console.log('📋 Dados:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.nutrition) {
      const { nutrition } = response.data;
      console.log('\n📊 RESUMO NUTRICIONAL:');
      console.log(`   Total: ${nutrition.totalCalories} kcal`);
      console.log(`   Proteína: ${nutrition.totalProtein}g`);
      console.log(`   Carboidratos: ${nutrition.totalCarbs}g`);
      console.log(`   Gordura: ${nutrition.totalFat}g\n`);

      if (nutrition.foods && nutrition.foods.length > 0) {
        console.log('🍽️  ALIMENTOS DETECTADOS:');
        nutrition.foods.forEach((food, index) => {
          console.log(`   ${index + 1}. ${food.name} (${food.portion}g) = ${food.calories} kcal`);
        });
      }
    }

    console.log('\n✅ Função está operacional!');
    return true;

  } catch (error) {
    console.error('\n❌ ERRO ao chamar função:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Mensagem:', error.message);
    }
    return false;
  }
}

testDeployedFunction();

