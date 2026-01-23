/**
 * Script para testar o Gemini API
 */

const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyBb-L_n82fXomaVkETRQAZvZIbCqyWoLbY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Teste 1: Texto simples
 */
async function testGeminiText() {
  console.log('\n🧪 TESTE 1: Texto Simples');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Diga "olá" em uma palavra'
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ Gemini respondeu:', text.trim());
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Teste 2: Análise de imagem (base64 de teste)
 */
async function testGeminiImage() {
  console.log('\n🧪 TESTE 2: Análise de Imagem com Prompt de Comida');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Imagem de teste pequena (1x1 pixel vermelho em base64)
  const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA';

  const prompt = `Analise esta imagem de comida e identifique todos os alimentos visíveis. 
Para cada alimento, forneça:
1. Nome do alimento em inglês (para busca nutricional)
2. Nome do alimento em português brasileiro
3. Quantidade estimada em gramas (g)

Responda APENAS com um JSON array no formato:
[
  {"name": "chicken breast", "name_pt": "Peito de Frango", "quantity": 150},
  {"name": "white rice", "name_pt": "Arroz Branco", "quantity": 200}
]`;

  try {
    console.log('📤 Enviando imagem de teste para Gemini...');
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: testImageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ Gemini respondeu!\n');
    console.log('📋 Resposta:', text);
    
    // Tentar parsear JSON
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const foods = JSON.parse(jsonMatch[0]);
        console.log('\n✅ JSON válido parseado:');
        console.log(JSON.stringify(foods, null, 2));
      }
    } catch (e) {
      console.log('\n⚠️  Resposta não está em formato JSON válido (normal para imagem de teste)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Executar testes
 */
async function runTests() {
  console.log('\n🔥 TESTE DA INTEGRAÇÃO GEMINI API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('🌐 Modelo: gemini-2.0-flash\n');

  const test1 = await testGeminiText();
  const test2 = await testGeminiImage();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`   Teste 1 (Texto): ${test1 ? '✅' : '❌'}`);
  console.log(`   Teste 2 (Imagem): ${test2 ? '✅' : '❌'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (test1 && test2) {
    console.log('🎉 Gemini API está funcionando corretamente!\n');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique a API Key ou quota.\n');
  }
}

runTests().catch(console.error);

