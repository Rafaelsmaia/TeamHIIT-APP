import { useState, useCallback } from 'react';
import { Droplets, Moon, Plus, Minus, Check } from 'lucide-react';
import useHabitSync from '../../hooks/useHabitSync.js';
import { getLocalDateString } from '../../utils/dateUtils.js';

const DEFAULT_WATER_AMOUNT = 200; // ml
const WATER_GOAL_LITERS = 2.5;
const SLEEP_GOAL_HOURS = 7;

function HabitTrackerSection({ currentUser, isDarkMode, addToast = () => {} }) {
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterAmount, setWaterAmount] = useState(DEFAULT_WATER_AMOUNT);
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  const [showSleepModal, setShowSleepModal] = useState(false);
  const [isEditingSleep, setIsEditingSleep] = useState(false);

  const {
    waterIntake,
    sleepHours,
    setSleepHours,
    waterHistory,
    sleepHistory,
    addWaterIntake,
    saveSleepEntry,
    loading,
    error
  } = useHabitSync(currentUser);

  const increaseWaterAmount = useCallback(() => {
    setWaterAmount(prev => Math.min(prev + 100, 2000));
  }, []);

  const decreaseWaterAmount = useCallback(() => {
    setWaterAmount(prev => Math.max(prev - 100, 50));
  }, []);

  const formatWaterAmount = useCallback((ml) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)} L`;
    }
    return `${ml} ml`;
  }, []);

  const handleWaterAmountChange = useCallback((event) => {
    const value = event.target.value;
    if (value === '') {
      setWaterAmount(0);
      return;
    }

    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      setWaterAmount(Math.min(Math.max(numValue, 0), 2000));
    }
  }, []);

  const handleAddWater = useCallback(async () => {
    try {
      await addWaterIntake(waterAmount);
      setShowWaterModal(false);
      setWaterAmount(DEFAULT_WATER_AMOUNT);
      addToast(`${formatWaterAmount(waterAmount)} adicionado com sucesso!`, 'success');
    } catch (err) {
      console.error('❌ [HabitTracker] Erro ao adicionar água:', err);
      addToast('Erro ao adicionar água', 'error');
    }
  }, [addWaterIntake, addToast, formatWaterAmount, waterAmount]);

  const increaseSleepHours = useCallback(() => {
    setSleepHours(prev => Math.min(prev + 0.5, 12));
  }, [setSleepHours]);

  const decreaseSleepHours = useCallback(() => {
    setSleepHours(prev => Math.max(prev - 0.5, 0));
  }, [setSleepHours]);

  const handleSleepChange = useCallback((event) => {
    const value = event.target.value;
    if (value === '') {
      setSleepHours(0);
      return;
    }

    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      setSleepHours(Math.min(Math.max(numValue, 0), 12));
    }
  }, [setSleepHours]);

  const handleSaveSleepHours = useCallback(async () => {
    try {
      await saveSleepEntry(sleepHours);
      setShowSleepModal(false);
      setIsEditingSleep(false);
      addToast(`${sleepHours}h de sono registrado!`, 'success');
    } catch (err) {
      console.error('❌ [HabitTracker] Erro ao salvar sono:', err);
      addToast('Erro ao salvar sono', 'error');
    }
  }, [addToast, saveSleepEntry, sleepHours]);

  const renderWeeklyDots = (history, goal, colorClass) => {
    return Array.from({ length: 7 }, (_, index) => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + index);
      const dateString = getLocalDateString(currentDate);
      const value = history?.[dateString] || 0;
      const isCompleted = value >= goal;

      return (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isCompleted
                ? `${colorClass} shadow-md`
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            {isCompleted && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][index]}
          </span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Carregando hábitos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
        Erro ao carregar hábitos. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Meus Hábitos</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 min-w-[300px] flex-shrink-0 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Beber Água</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {waterIntake.toFixed(1)} de {WATER_GOAL_LITERS} L
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWaterModal(true)}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-md"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex justify-between gap-2">
            {renderWeeklyDots(waterHistory, WATER_GOAL_LITERS, 'bg-blue-500')}
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 min-w-[300px] flex-shrink-0 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sono</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sleepHours}h de sono</p>
              </div>
            </div>

            <button
              onClick={() => setShowSleepModal(true)}
              className="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors shadow-md"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex justify-between gap-2">
            {renderWeeklyDots(sleepHistory, SLEEP_GOAL_HOURS, 'bg-purple-500')}
          </div>
        </div>
      </div>

      {showWaterModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">Adicionar Água</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Meta diária: {WATER_GOAL_LITERS}L</p>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative w-12 h-16">
                <svg className="w-12 h-16" viewBox="0 0 48 64">
                  <path d="M12 8L12 56C12 58 14 60 16 60L32 60C34 60 36 58 36 56L36 8L12 8Z" stroke="#3B82F6" strokeWidth="2" fill="none" />
                  <rect x="14" y="20" width="20" height="32" fill="#3B82F6" opacity="0.6" />
                </svg>
              </div>

              <div className="relative w-12 h-16">
                <svg className="w-12 h-16" viewBox="0 0 48 64">
                  <path d="M12 8L12 56C12 58 14 60 16 60L32 60C34 60 36 58 36 56L36 8L12 8Z" stroke="#D1D5DB" strokeWidth="2" fill="none" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <button onClick={decreaseWaterAmount} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <Minus className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center">
                {isEditingAmount ? (
                  <input
                    type="number"
                    value={waterAmount}
                    onChange={handleWaterAmountChange}
                    onBlur={() => setIsEditingAmount(false)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setIsEditingAmount(false);
                      }
                    }}
                    className="text-2xl font-bold text-orange-500 text-center bg-transparent border-b-2 border-orange-500 outline-none w-24"
                    min="0"
                    max="2000"
                    step="50"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingAmount(true)}
                    className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    {formatWaterAmount(waterAmount)}
                  </button>
                )}
              </div>

              <button onClick={increaseWaterAmount} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button onClick={handleAddWater} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors">
              Adicionar Água
            </button>

            <button onClick={() => setShowWaterModal(false)} className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showSleepModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">Registrar Sono</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Meta diária: {SLEEP_GOAL_HOURS}h</p>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <button onClick={decreaseSleepHours} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <Minus className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center">
                {isEditingSleep ? (
                  <input
                    type="number"
                    value={sleepHours}
                    onChange={handleSleepChange}
                    onBlur={() => setIsEditingSleep(false)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setIsEditingSleep(false);
                      }
                    }}
                    className="text-2xl font-bold text-purple-500 text-center bg-transparent border-b-2 border-purple-500 outline-none w-24"
                    min="0"
                    max="12"
                    step="0.5"
                    autoFocus
                  />
                ) : (
                  <button onClick={() => setIsEditingSleep(true)} className="text-2xl font-bold text-purple-500 hover:text-purple-600 transition-colors">
                    {sleepHours}h
                  </button>
                )}
              </div>

              <button onClick={increaseSleepHours} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button onClick={handleSaveSleepHours} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition-colors">
              Salvar Sono
            </button>

            <button onClick={() => setShowSleepModal(false)} className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default HabitTrackerSection;
