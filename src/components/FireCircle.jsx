import { useTheme } from '../contexts/ThemeContext.jsx';

const FireCircle = ({ dayNumber, isActive, hasWorkout, className = "" }) => {
  const { isDarkMode } = useTheme();
  
  // Determinar as classes de animação baseadas no estado
  const getAnimationClasses = () => {
    if (hasWorkout && isActive) {
      return "fire-current-day fire-hover";
    } else if (hasWorkout) {
      return "fire-flicker fire-hover";
    } else if (isActive) {
      return "fire-glow";
    }
    return "fire-transition";
  };

  // Determinar a cor do ícone
  const getIconColor = () => {
    if (hasWorkout) return '#f97316'; // orange-500
    if (isActive) return isDarkMode ? '#e5e7eb' : '#1f2937'; // gray-200 : gray-800
    return isDarkMode ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  };

  // Debug: Log dos valores para verificar
  // console.log(`🔥 [FireCircle Debug] Day ${dayNumber}:`, {
  //   hasWorkout,
  //   isActive,
  //   isDarkMode,
  //   iconColor: getIconColor(),
  //   animationClasses: getAnimationClasses()
  // });

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Ícone de Chama - SVG nativo para garantir renderização */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill={hasWorkout ? getIconColor() : 'none'}
        stroke={getIconColor()}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`mb-1 transition-all duration-500 ${getAnimationClasses()} ${
          hasWorkout ? 'drop-shadow-lg' : ''
        }`}
        style={{ 
          filter: hasWorkout ? 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.4))' : 'none',
          backgroundColor: hasWorkout ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
          borderRadius: '50%',
          padding: '4px'
        }}
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      
      {/* Número do dia embaixo da chama */}
      <span 
        className={`text-xs font-medium transition-all duration-500 ${
          hasWorkout 
            ? 'text-orange-500' 
            : isActive 
              ? isDarkMode ? 'text-gray-300' : 'text-gray-700'
              : isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}
      >
        {dayNumber}
      </span>
    </div>
  );
};

export default FireCircle;
