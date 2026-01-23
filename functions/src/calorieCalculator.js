/**
 * Módulo para calcular calorias usando Google Gemini API + FatSecret API
 * Similar ao Calorify: https://ai.google.dev/competition/projects/calorify-ai-calorie-scanner
 */

const axios = require("axios");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

// Definir secrets para as chaves do Gemini e FatSecret
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const fatSecretConsumerKey = defineSecret("FATSECRET_CONSUMER_KEY");
const fatSecretConsumerSecret = defineSecret("FATSECRET_CONSUMER_SECRET");

// URLs das APIs - Usando modelo gemini-2.0-flash
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const FATSECRET_API_URL = "https://platform.fatsecret.com/rest/server.api";

/**
 * Reconhece alimentos em uma imagem usando Google Gemini API
 * @param {string} imageBase64 - Imagem em base64
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Array<Object>>} - Lista de alimentos identificados com porções
 */
async function recognizeFoodFromImage(imageBase64, apiKey) {
  try {
    if (!apiKey) {
      console.warn("⚠️ [CalorieCalculator] Gemini API Key não configurada.");
      return [];
    }

    // Prompt para o Gemini identificar alimentos e porções
    const prompt = `Analise esta imagem de comida e identifique todos os alimentos visíveis. 
Para cada alimento, forneça:
1. Nome do alimento em inglês (para busca nutricional)
2. Nome do alimento em português brasileiro
3. Quantidade estimada em gramas (g)

Responda APENAS com um JSON array no formato:
[
  {"name": "chicken breast", "name_pt": "Peito de Frango", "quantity": 150},
  {"name": "white rice", "name_pt": "Arroz Branco", "quantity": 200}
]

Seja específico com os nomes dos alimentos. Não inclua pratos, utensílios ou embalagens.
Os nomes em português devem ter a primeira letra de cada palavra em maiúsculo.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Tentar extrair JSON da resposta
    let foods = [];
    try {
      // Remover markdown code blocks se existirem
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        foods = JSON.parse(jsonMatch[0]);
      } else {
        // Tentar parse direto
        foods = JSON.parse(text);
      }
    } catch (parseError) {
      console.warn("⚠️ [CalorieCalculator] Erro ao parsear resposta do Gemini:", parseError);
      // Tentar extrair nomes de alimentos do texto
      const foodNames = text.match(/"name"\s*:\s*"([^"]+)"/g) || [];
      foods = foodNames.map((match) => {
        const name = match.match(/"name"\s*:\s*"([^"]+)"/)[1];
        return { name, quantity: 100 }; // Quantidade padrão
      });
    }

    // Validar e normalizar
    if (!Array.isArray(foods)) {
      foods = [];
    }

    foods = foods
      .filter((food) => food && food.name)
      .map((food) => ({
        name: food.name.toLowerCase().trim(), // Nome em inglês para busca
        name_pt: food.name_pt || food.name, // Nome em português para exibição
        quantity: food.quantity || 100, // Default 100g se não especificado
      }))
      .slice(0, 10); // Limitar a 10 alimentos

    console.log(`✅ [CalorieCalculator] ${foods.length} alimentos identificados pelo Gemini:`, foods);
    return foods;
  } catch (error) {
    console.error("❌ [CalorieCalculator] Erro no reconhecimento de imagem (Gemini):", error.message);
    if (error.response) {
      console.error("❌ [CalorieCalculator] Resposta do erro:", error.response.data);
    }
    return [];
  }
}

/**
 * Gera assinatura OAuth 1.0 para FatSecret API
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

/**
 * Busca informações nutricionais de um alimento usando FatSecret API
 * @param {string} foodName - Nome do alimento
 * @param {number} quantity - Quantidade em gramas
 * @param {string} consumerKey - FatSecret Consumer Key
 * @param {string} consumerSecret - FatSecret Consumer Secret
 * @returns {Promise<Object|null>} - Dados nutricionais do alimento
 */
async function searchFoodInFatSecret(foodName, quantity, consumerKey, consumerSecret) {
  try {
    // Primeiro, buscar o alimento
    const searchParams = {
      method: "foods.search",
      search_expression: foodName,
      format: "json",
      oauth_consumer_key: consumerKey,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString("hex"),
      oauth_version: "1.0",
    };

    // Gerar assinatura
    searchParams.oauth_signature = generateOAuthSignature(
      "GET",
      FATSECRET_API_URL,
      searchParams,
      consumerSecret
    );

    // Debug: Mostrar parâmetros da requisição
    console.log(`🔍 [FatSecret] Buscando: "${foodName}"...`);
    console.log(`🔑 [FatSecret Debug] Consumer Key usado: ${consumerKey.substring(0, 10)}...`);
    console.log(`🔑 [FatSecret Debug] URL: ${FATSECRET_API_URL}`);
    const searchResponse = await axios.get(FATSECRET_API_URL, {
      params: searchParams,
    });

    console.log(`📋 [FatSecret] Resposta para "${foodName}":`, JSON.stringify(searchResponse.data).substring(0, 500));

    const foods = searchResponse.data?.foods?.food || [];
    if (!foods || foods.length === 0) {
      console.warn(`⚠️ [CalorieCalculator] Alimento "${foodName}" não encontrado no FatSecret`);
      // Verificar se há erro na resposta
      if (searchResponse.data?.error) {
        console.error(`❌ [FatSecret] Erro na API:`, searchResponse.data.error);
      }
      return null;
    }

    // Pegar o primeiro resultado (mais relevante)
    const food = Array.isArray(foods) ? foods[0] : foods;
    const foodId = food.food_id;

    // Buscar informações nutricionais detalhadas
    const nutritionParams = {
      method: "food.get.v3",
      food_id: foodId,
      format: "json",
      oauth_consumer_key: consumerKey,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString("hex"),
      oauth_version: "1.0",
    };

    nutritionParams.oauth_signature = generateOAuthSignature(
      "GET",
      FATSECRET_API_URL,
      nutritionParams,
      consumerSecret
    );

    const nutritionResponse = await axios.get(FATSECRET_API_URL, {
      params: nutritionParams,
    });

    const foodData = nutritionResponse.data?.food || null;
    if (!foodData) {
      return null;
    }

    // Extrair informações nutricionais por 100g
    const servings = foodData.servings?.serving || [];
    const serving = Array.isArray(servings) ? servings[0] : servings;

    if (!serving) {
      return null;
    }

    // Calcular valores nutricionais baseado na quantidade
    const servingSizeInGrams = parseFloat(serving.metric_serving_amount || 100);
    const caloriesPerServing = parseFloat(serving.calories || 0);
    
    // 1. Calcular calorias por grama (abordagem mais robusta)
    let caloriesPerGram = 0;
    if (servingSizeInGrams > 0) {
      caloriesPerGram = caloriesPerServing / servingSizeInGrams;
    } else {
      // Fallback: se o serving size for 0, assumir que o serving é 100g (para evitar divisão por zero)
      caloriesPerGram = caloriesPerServing / 100;
    }
    
    // 2. Calcular os valores finais
    const calories = Math.round(caloriesPerGram * quantity);
    
    // 3. Calcular macros (usando a mesma lógica de calorias por grama)
    const proteinPerGram = parseFloat(serving.protein || 0) / servingSizeInGrams;
    const carbsPerGram = parseFloat(serving.carbohydrate || 0) / servingSizeInGrams;
    const fatPerGram = parseFloat(serving.fat || 0) / servingSizeInGrams;
    
    const protein = Math.round(proteinPerGram * quantity * 10) / 10;
    const carbs = Math.round(carbsPerGram * quantity * 10) / 10;
    const fat = Math.round(fatPerGram * quantity * 10) / 10;

    return {
      name: foodData.food_name || foodName,
      quantity: quantity,
      calories,
      protein,
      carbs,
      fat,
    };
  } catch (error) {
    console.error(`❌ [CalorieCalculator] Erro ao buscar "${foodName}" no FatSecret:`, error.message);
    if (error.response) {
      console.error("❌ [CalorieCalculator] Resposta do erro:", error.response.data);
    }
    return null;
  }
}

/**
 * Estima valores nutricionais baseado no tipo de alimento
 * Valores aproximados por 100g
 */
function estimateNutrition(foodName, quantity) {
  const name = foodName.toLowerCase();
  
  // Tabela de estimativas por categoria (valores por 100g)
  let caloriesPer100g = 150; // Padrão
  let proteinPer100g = 5;
  let carbsPer100g = 20;
  let fatPer100g = 3;
  
  // Proteínas (carnes, peixes, ovos)
  if (name.match(/chicken|beef|pork|fish|salmon|tuna|egg|meat|steak|turkey/i)) {
    caloriesPer100g = 180;
    proteinPer100g = 25;
    carbsPer100g = 0;
    fatPer100g = 8;
  }
  // Arroz, massas, grãos
  else if (name.match(/rice|pasta|noodle|bread|wheat|grain|oat/i)) {
    caloriesPer100g = 130;
    proteinPer100g = 3;
    carbsPer100g = 28;
    fatPer100g = 0.3;
  }
  // Batata, tubérculos
  else if (name.match(/potato|sweet potato|yam|cassava/i)) {
    caloriesPer100g = 85;
    proteinPer100g = 2;
    carbsPer100g = 20;
    fatPer100g = 0.1;
  }
  // Feijão, leguminosas
  else if (name.match(/bean|lentil|chickpea|pea/i)) {
    caloriesPer100g = 120;
    proteinPer100g = 8;
    carbsPer100g = 20;
    fatPer100g = 0.5;
  }
  // Frutas
  else if (name.match(/apple|banana|orange|grape|melon|berry|fruit/i)) {
    caloriesPer100g = 60;
    proteinPer100g = 0.5;
    carbsPer100g = 15;
    fatPer100g = 0.2;
  }
  // Vegetais folhosos (muito baixa caloria)
  else if (name.match(/lettuce|spinach|kale|cabbage|cucumber|celery|zucchini/i)) {
    caloriesPer100g = 20;
    proteinPer100g = 1.5;
    carbsPer100g = 3;
    fatPer100g = 0.2;
  }
  // Vegetais gerais (brócolis, couve-flor, tomate, etc.)
  else if (name.match(/broccoli|cauliflower|tomato|pepper|onion|garlic|mushroom|asparagus|green bean|vegetable/i)) {
    caloriesPer100g = 30;
    proteinPer100g = 2;
    carbsPer100g = 5;
    fatPer100g = 0.3;
  }
  // Raízes e tubérculos não-batata (cenoura, beterraba, etc.)
  else if (name.match(/carrot|beet|turnip|radish|parsnip|cenoura|beterraba/i)) {
    caloriesPer100g = 40;
    proteinPer100g = 1;
    carbsPer100g = 9;
    fatPer100g = 0.2;
  }
  // Leite e derivados
  else if (name.match(/milk|cheese|yogurt|dairy/i)) {
    caloriesPer100g = 100;
    proteinPer100g = 6;
    carbsPer100g = 5;
    fatPer100g = 5;
  }
  // Sobremesas, doces
  else if (name.match(/cake|cookie|chocolate|candy|ice cream|dessert/i)) {
    caloriesPer100g = 350;
    proteinPer100g = 4;
    carbsPer100g = 50;
    fatPer100g = 15;
  }
  // Óleos, gorduras
  else if (name.match(/oil|butter|margarine|mayo/i)) {
    caloriesPer100g = 750;
    proteinPer100g = 0;
    carbsPer100g = 0;
    fatPer100g = 85;
  }
  
  // Calcular baseado na quantidade
  const multiplier = quantity / 100;
  return {
    calories: Math.round(caloriesPer100g * multiplier),
    protein: Math.round((proteinPer100g * multiplier) * 10) / 10,
    carbs: Math.round((carbsPer100g * multiplier) * 10) / 10,
    fat: Math.round((fatPer100g * multiplier) * 10) / 10,
  };
}

/**
 * Processa uma imagem e identifica alimentos usando Gemini + FatSecret
 * @param {string} imageBase64 - Imagem em base64 (sem prefixo data:image)
 * @param {string} geminiKey - Gemini API Key
 * @param {string} fatSecretKey - FatSecret Consumer Key
 * @param {string} fatSecretSecret - FatSecret Consumer Secret
 * @returns {Promise<Object>} - Resultado com alimentos identificados e calorias
 */
async function analyzeFoodImage(imageBase64, geminiKey, fatSecretKey, fatSecretSecret) {
  try {
    console.log("🔍 [CalorieCalculator] Iniciando análise da imagem com Gemini + FatSecret...");

    if (!geminiKey) {
      throw new Error(
        "Gemini API Key não configurada. " +
        "Configure a variável de ambiente GEMINI_API_KEY."
      );
    }

    if (!fatSecretKey || !fatSecretSecret) {
      throw new Error(
        "FatSecret credentials não configuradas. " +
        "Configure FATSECRET_CONSUMER_KEY e FATSECRET_CONSUMER_SECRET."
      );
    }

    // Passo 1: Reconhecer alimentos na imagem usando Gemini
    const recognizedFoods = await recognizeFoodFromImage(imageBase64, geminiKey);

    // Se não reconheceu nada, retornar erro informativo
    if (recognizedFoods.length === 0) {
      console.warn("⚠️ [CalorieCalculator] Nenhum alimento foi identificado na imagem.");
      return {
        success: true,
        foods: [],
        nutrition: {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          foods: [],
        },
        message: "Nenhum alimento foi identificado na imagem. Tente uma foto mais clara ou com melhor iluminação.",
      };
    }

    console.log(`📋 [CalorieCalculator] ${recognizedFoods.length} alimentos identificados pelo Gemini`);

    // Passo 2: Buscar informações nutricionais no FatSecret
    const foodDetails = [];

    for (const food of recognizedFoods.slice(0, 10)) { // Limitar a 10 alimentos
      const nutritionData = await searchFoodInFatSecret(
        food.name, // Usar nome em inglês para busca no FatSecret
        food.quantity,
        fatSecretKey,
        fatSecretSecret
      );

      if (nutritionData) {
        foodDetails.push({
          name: food.name_pt || food.name, // Usar nome em português para exibição
          portion: nutritionData.quantity,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
        });
      } else {
        // Se não encontrou no FatSecret, usar estimativas baseadas no tipo de alimento
        console.warn(`⚠️ [CalorieCalculator] Alimento "${food.name}" não encontrado no FatSecret - usando estimativa`);
        const estimated = estimateNutrition(food.name, food.quantity);
        foodDetails.push({
          name: food.name_pt || food.name, // Usar nome em português para exibição
          portion: food.quantity,
          calories: estimated.calories,
          protein: estimated.protein,
          carbs: estimated.carbs,
          fat: estimated.fat,
        });
      }
    }

    // Passo 3: Calcular totais
    const totalCalories = foodDetails.reduce((sum, food) => sum + food.calories, 0);
    const totalProtein = foodDetails.reduce((sum, food) => sum + food.protein, 0);
    const totalCarbs = foodDetails.reduce((sum, food) => sum + food.carbs, 0);
    const totalFat = foodDetails.reduce((sum, food) => sum + food.fat, 0);

    const result = {
      success: true,
      foods: foodDetails.map((f) => f.name),
      nutrition: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        foods: foodDetails,
      },
    };

    console.log(`✅ [CalorieCalculator] Análise concluída: ${totalCalories} kcal`);
    return result;
  } catch (error) {
    console.error("❌ [CalorieCalculator] Erro ao analisar imagem:", error);
    console.error("❌ [CalorieCalculator] Stack:", error.stack);

    // Melhorar mensagem de erro
    if (error.message.includes("Gemini API Key")) {
      throw new Error(
        "Gemini não configurado. Configure a variável de ambiente GEMINI_API_KEY."
      );
    }

    if (error.message.includes("FatSecret")) {
      throw new Error(
        "FatSecret não configurado. Configure FATSECRET_CONSUMER_KEY e FATSECRET_CONSUMER_SECRET."
      );
    }

    throw error;
  }
}

/**
 * Wrapper para usar com secrets do Firebase Functions
 */
async function analyzeFoodImageWithSecrets(imageBase64) {
  // Obter secrets
  const geminiKey = geminiApiKey.value();
  const fatSecretKey = fatSecretConsumerKey.value();
  const fatSecretSecret = fatSecretConsumerSecret.value();

  // Debug: verificar se as secrets foram carregadas
  console.log("🔑 [Debug] Secrets carregadas:");
  console.log(`   Gemini Key: ${geminiKey ? geminiKey.substring(0, 20) + "..." : "VAZIO"}`);
  console.log(`   FatSecret Key: ${fatSecretKey ? fatSecretKey.substring(0, 10) + "..." : "VAZIO"}`);
  console.log(`   FatSecret Secret: ${fatSecretSecret ? fatSecretSecret.substring(0, 10) + "..." : "VAZIO"}`);

  return analyzeFoodImage(imageBase64, geminiKey, fatSecretKey, fatSecretSecret);
}

module.exports = {
  analyzeFoodImage: analyzeFoodImageWithSecrets,
  analyzeFoodImageWithSecrets,
  recognizeFoodFromImage,
  searchFoodInFatSecret,
};
