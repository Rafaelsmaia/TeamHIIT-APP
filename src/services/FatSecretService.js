/**
 * Serviço de integração com FatSecret API
 * Busca informações nutricionais de alimentos
 */

import { NUTRITION_CONFIG } from '../config/environment.js';

const FATSECRET_CLIENT_ID = NUTRITION_CONFIG.fatSecretClientId || import.meta.env.VITE_FATSECRET_CLIENT_ID;
const FATSECRET_CLIENT_SECRET = NUTRITION_CONFIG.fatSecretClientSecret || import.meta.env.VITE_FATSECRET_CLIENT_SECRET;

// Cache do token de acesso
let accessToken = null;
let tokenExpiry = null;

/**
 * Obtém um token de acesso OAuth2 do FatSecret
 * @returns {Promise<string>} Token de acesso
 */
async function getAccessToken() {
  // Verificar se o token ainda é válido
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    throw new Error('Credenciais do FatSecret não configuradas. Adicione VITE_FATSECRET_CLIENT_ID e VITE_FATSECRET_CLIENT_SECRET no arquivo .env');
  }

  try {
    const credentials = btoa(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`);
    
    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=basic'
    });

    if (!response.ok) {
      throw new Error('Falha ao obter token do FatSecret');
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Token expira em 24h, mas renovamos 1h antes
    tokenExpiry = Date.now() + ((data.expires_in - 3600) * 1000);
    
    console.log('✅ [FatSecret] Token obtido com sucesso');
    return accessToken;

  } catch (error) {
    console.error('❌ [FatSecret] Erro ao obter token:', error);
    throw error;
  }
}

/**
 * Busca alimentos por nome
 * @param {string} searchTerm - Nome do alimento para buscar
 * @param {number} maxResults - Número máximo de resultados
 * @returns {Promise<Array>} Lista de alimentos encontrados
 */
export async function searchFood(searchTerm, maxResults = 5) {
  const token = await getAccessToken();

  try {
    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(searchTerm)}&format=json&max_results=${maxResults}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar alimentos');
    }

    const data = await response.json();
    
    if (!data.foods?.food) {
      return [];
    }

    // Normalizar resultado (pode ser array ou objeto único)
    const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
    
    console.log(`✅ [FatSecret] Encontrados ${foods.length} resultados para "${searchTerm}"`);
    return foods;

  } catch (error) {
    console.error('❌ [FatSecret] Erro na busca:', error);
    throw error;
  }
}

/**
 * Obtém detalhes nutricionais de um alimento pelo ID
 * @param {string} foodId - ID do alimento no FatSecret
 * @returns {Promise<Object>} Detalhes do alimento
 */
export async function getFoodDetails(foodId) {
  const token = await getAccessToken();

  try {
    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${foodId}&format=json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao obter detalhes do alimento');
    }

    const data = await response.json();
    return data.food;

  } catch (error) {
    console.error('❌ [FatSecret] Erro ao obter detalhes:', error);
    throw error;
  }
}

/**
 * Extrai informações nutricionais de uma descrição do FatSecret
 * @param {string} description - Descrição do alimento (ex: "Per 100g - Calories: 250kcal | Fat: 10g | ...")
 * @returns {Object} Objeto com calorias e macros
 */
export function parseNutritionFromDescription(description) {
  const nutrition = {
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    serving: ''
  };

  if (!description) return nutrition;

  // Extrair porção (ex: "Per 100g" ou "Per 1 serving")
  const servingMatch = description.match(/Per\s+([^-]+)/i);
  if (servingMatch) {
    nutrition.serving = servingMatch[1].trim();
  }

  // Extrair calorias
  const caloriesMatch = description.match(/Calories:\s*(\d+(?:\.\d+)?)/i);
  if (caloriesMatch) {
    nutrition.calories = parseFloat(caloriesMatch[1]);
  }

  // Extrair gordura
  const fatMatch = description.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
  if (fatMatch) {
    nutrition.fat = parseFloat(fatMatch[1]);
  }

  // Extrair carboidratos
  const carbsMatch = description.match(/Carbs:\s*(\d+(?:\.\d+)?)/i);
  if (carbsMatch) {
    nutrition.carbs = parseFloat(carbsMatch[1]);
  }

  // Extrair proteína
  const proteinMatch = description.match(/Protein:\s*(\d+(?:\.\d+)?)/i);
  if (proteinMatch) {
    nutrition.protein = parseFloat(proteinMatch[1]);
  }

  return nutrition;
}

/**
 * Busca informações nutricionais completas de um alimento
 * @param {string} foodName - Nome do alimento
 * @param {number} quantityGrams - Quantidade em gramas
 * @returns {Promise<Object>} Informações nutricionais ajustadas pela quantidade
 */
export async function getNutritionInfo(foodName, quantityGrams = 100) {
  try {
    // Buscar alimento
    const results = await searchFood(foodName, 1);
    
    if (results.length === 0) {
      // Tentar busca em inglês se não encontrar
      console.log(`⚠️ [FatSecret] Não encontrado "${foodName}", tentando alternativas...`);
      return null;
    }

    const food = results[0];
    const baseNutrition = parseNutritionFromDescription(food.food_description);
    
    // Ajustar pela quantidade (baseado em 100g ou porção padrão)
    let multiplier = 1;
    
    if (baseNutrition.serving.includes('100g')) {
      multiplier = quantityGrams / 100;
    } else if (baseNutrition.serving.includes('g')) {
      const servingGrams = parseFloat(baseNutrition.serving.match(/(\d+)/)?.[1] || 100);
      multiplier = quantityGrams / servingGrams;
    }

    return {
      food_id: food.food_id,
      food_name: food.food_name,
      brand_name: food.brand_name || null,
      quantity_grams: quantityGrams,
      nutrition: {
        calories: Math.round(baseNutrition.calories * multiplier),
        protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
        carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
        fat: Math.round(baseNutrition.fat * multiplier * 10) / 10
      },
      original_serving: baseNutrition.serving
    };

  } catch (error) {
    console.error('❌ [FatSecret] Erro ao buscar nutrição:', error);
    throw error;
  }
}

export default {
  searchFood,
  getFoodDetails,
  getNutritionInfo,
  parseNutritionFromDescription
};

