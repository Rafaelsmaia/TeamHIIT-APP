import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Loader2, Utensils, Flame, Beef, Wheat, Droplets, Image as ImageIcon, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Header from '../components/ui/Header.jsx';
import BottomNavigation from '../components/ui/BottomNavigation.jsx';
import { fileToBase64 } from '../services/GeminiService.js';
import { usePWAAuth } from '../hooks/UsePWAAuth.js';

// URL da Firebase Function (recriada)
const CALCULATE_CALORIES_URL = 'https://us-central1-comunidade-team-hiit.cloudfunctions.net/calculateCalories';

function CalorieCalculator() {
  const { isDarkMode } = useTheme();
  const { hasCalorieCalculator, loading: authLoading } = usePWAAuth();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  // Estados
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Verificar se há uma imagem pendente do botão de câmera do BottomNavigation
  useEffect(() => {
    const pendingImage = sessionStorage.getItem('pendingCalorieImage');
    const pendingImageName = sessionStorage.getItem('pendingCalorieImageName');
    const pendingImageType = sessionStorage.getItem('pendingCalorieImageType');
    
    if (pendingImage) {
      // Converter base64 de volta para File
      fetch(pendingImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], pendingImageName || 'photo.jpg', { 
            type: pendingImageType || 'image/jpeg' 
          });
          setImageFile(file);
          setImagePreview(pendingImage);
          
          // Limpar sessionStorage
          sessionStorage.removeItem('pendingCalorieImage');
          sessionStorage.removeItem('pendingCalorieImageName');
          sessionStorage.removeItem('pendingCalorieImageType');
        });
    }
  }, []);

  // Selecionar arquivo (câmera ou galeria)
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setAnalysisResult(null);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  }, []);

  // Analisar imagem usando Firebase Function
  const analyzeImage = useCallback(async () => {
    if (!imageFile) {
      setError('Selecione ou tire uma foto primeiro.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // 1. Converter imagem para base64
      const { base64 } = await fileToBase64(imageFile);
      
      // 2. Enviar para Firebase Function (que usa Gemini + FatSecret)
      const response = await fetch(CALCULATE_CALORIES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64 })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao analisar imagem');
      }

      // 3. Processar resultado
      const foods = result.nutrition?.foods || [];
      
      if (foods.length === 0) {
        setError(result.message || 'Nenhum alimento identificado na imagem. Tente uma foto mais clara.');
        setIsAnalyzing(false);
        return;
      }

      // 4. Formatar para exibição
      const formattedFoods = foods.map(food => ({
        name: food.name,
        quantity: `${food.portion}g`,
        quantity_grams: food.portion,
        nutrition: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        }
      }));

      setAnalysisResult({
        description: `${foods.length} alimento(s) identificado(s)`,
        foods: formattedFoods,
        totals: {
          calories: result.nutrition.totalCalories,
          protein: result.nutrition.totalProtein,
          carbs: result.nutrition.totalCarbs,
          fat: result.nutrition.totalFat
        }
      });

    } catch (err) {
      console.error('Erro na análise:', err);
      setError(err.message || 'Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile]);

  // Resetar tudo
  const resetAll = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
  }, []);

  // Tela de carregamento enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header />
        <div className="pt-16 pb-24 px-4 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Tela de recurso bloqueado (quando não tem acesso)
  if (!hasCalorieCalculator) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header />
        <div className="pt-16 pb-24 px-4 max-w-lg mx-auto">
          <div className="text-center py-12">
            {/* Ícone de bloqueio */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            
            <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recurso Premium
            </h1>
            
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A Calculadora de Calorias por IA é um recurso exclusivo.
            </p>

            {/* Card de benefícios */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6 text-left`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Com este recurso você pode:
              </h3>
              <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Tirar foto da sua refeição</span>
                </li>
                <li className="flex items-start gap-3">
                  <Utensils className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Identificar alimentos automaticamente com IA</span>
                </li>
                <li className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Calcular calorias e macros em segundos</span>
                </li>
              </ul>
            </div>

            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Entre em contato para saber como liberar este recurso.
            </p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      
      <div className="pt-16 pb-24 px-4 max-w-lg mx-auto">
        {/* Título */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Calculadora de Calorias
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Tire uma foto do seu prato para calcular as calorias
          </p>
        </div>

        {/* Preview da imagem */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full aspect-[4/3] object-cover"
            />
            <button
              onClick={resetAll}
              className="absolute top-3 right-3 p-2 rounded-full bg-gray-900/70 text-white hover:bg-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Botões de ação - Câmera e Galeria */}
        {!imagePreview && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Input para Câmera (abre câmera nativa no mobile) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all ${
                isDarkMode 
                  ? 'border-gray-700 hover:border-orange-500 hover:bg-gray-800/50' 
                  : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <Camera className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tirar Foto
              </span>
            </button>

            {/* Input para Galeria (abre seletor de arquivos) */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => galleryInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all ${
                isDarkMode 
                  ? 'border-gray-700 hover:border-orange-500 hover:bg-gray-800/50' 
                  : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <ImageIcon className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Galeria
              </span>
            </button>
          </div>
        )}

        {/* Botão de análise */}
        {imagePreview && !analysisResult && (
          <button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              isAnalyzing 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                Analisar Alimentos
              </>
            )}
          </button>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Resultados */}
        {analysisResult && (
          <div className="mt-6 space-y-4">
            {/* Card de totais */}
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Total Estimado
              </h3>
              
              {/* Calorias em destaque */}
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="w-8 h-8 text-orange-500" />
                    <span className="text-5xl font-bold text-orange-500">
                      {analysisResult.totals.calories}
                    </span>
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    calorias
                  </span>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                  <Beef className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analysisResult.totals.protein}g
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Proteína
                  </div>
                </div>

                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                  <Wheat className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analysisResult.totals.carbs}g
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Carboidratos
                  </div>
                </div>

                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analysisResult.totals.fat}g
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Gorduras
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de alimentos */}
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Alimentos Identificados
              </h3>
              
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {analysisResult.description}
              </p>

              <div className="space-y-3">
                {analysisResult.foods.map((food, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {food.name}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {food.quantity}
                        </p>
                      </div>
                      {food.nutrition && (
                        <div className="text-right">
                          <span className="text-orange-500 font-bold">
                            {food.nutrition.calories} kcal
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {food.nutrition && (
                      <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} flex gap-4 text-xs`}>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          P: {food.nutrition.protein}g
                        </span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          C: {food.nutrition.carbs}g
                        </span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          G: {food.nutrition.fat}g
                        </span>
                      </div>
                    )}

                    {!food.nutrition && (
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        ⚠️ Dados nutricionais não encontrados
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botão de nova análise */}
            <button
              onClick={resetAll}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Nova Análise
            </button>

            {/* Aviso */}
            <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              ⚠️ Os valores são estimativas baseadas em IA e podem variar. 
              Para precisão, consulte um nutricionista.
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default CalorieCalculator;
