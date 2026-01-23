/**
 * Serviço de integração com Google Gemini
 * Usa visão computacional para identificar alimentos em imagens
 */

import { NUTRITION_CONFIG } from '../config/environment.js';

const GEMINI_API_KEY = NUTRITION_CONFIG.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Analisa uma imagem de alimento usando Gemini Vision
 * @param {string} imageBase64 - Imagem em base64 (sem o prefixo data:image/...)
 * @param {string} mimeType - Tipo da imagem (image/jpeg, image/png, etc)
 * @returns {Promise<Object>} - Dados do alimento identificado
 */
export async function analyzeFood(imageBase64, mimeType = 'image/jpeg') {
  if (!GEMINI_API_KEY) {
    throw new Error('Chave da API do Gemini não configurada. Adicione VITE_GEMINI_API_KEY no arquivo .env');
  }

  const prompt = `Analise esta imagem de alimento e retorne APENAS um JSON válido (sem markdown, sem código) com a seguinte estrutura:
{
  "identified": true,
  "foods": [
    {
      "name": "nome do alimento em português",
      "name_en": "food name in english",
      "quantity": "quantidade estimada (ex: 1 porção, 200g, 1 unidade)",
      "quantity_grams": número estimado em gramas,
      "confidence": número de 0 a 1 indicando confiança na identificação
    }
  ],
  "description": "descrição breve do prato/refeição"
}

Se não conseguir identificar alimentos na imagem, retorne:
{
  "identified": false,
  "error": "motivo"
}

Seja preciso nas estimativas de quantidade. Considere o tamanho aparente dos alimentos na imagem.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Gemini] Erro na API:', errorData);
      throw new Error(errorData.error?.message || 'Erro ao analisar imagem');
    }

    const data = await response.json();
    
    // Extrair o texto da resposta
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Resposta vazia do Gemini');
    }

    // Limpar e fazer parse do JSON
    let cleanJson = textResponse.trim();
    
    // Remover possíveis marcadores de código markdown
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const result = JSON.parse(cleanJson);
    
    console.log('✅ [Gemini] Alimentos identificados:', result);
    return result;

  } catch (error) {
    console.error('❌ [Gemini] Erro:', error);
    throw error;
  }
}

/**
 * Converte um File/Blob para base64
 * @param {File|Blob} file - Arquivo de imagem
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove o prefixo "data:image/jpeg;base64,"
      const base64 = result.split(',')[1];
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg'
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default {
  analyzeFood,
  fileToBase64
};

