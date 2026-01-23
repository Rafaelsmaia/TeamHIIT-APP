import { useTheme } from '../contexts/ThemeContext.jsx';

const LoadingSpinner = ({ message = "Carregando...", size = "medium" }) => {
  const { isDarkMode } = useTheme();
  
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-12 w-12", 
    large: "h-16 w-16"
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
