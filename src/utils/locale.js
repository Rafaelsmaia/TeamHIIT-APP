// Configuração de localização para português brasileiro
export const localeConfig = {
  // Configurar locale padrão
  defaultLocale: 'pt-BR',
  
  // Configurar Intl para português
  numberFormat: new Intl.NumberFormat('pt-BR'),
  dateFormat: new Intl.DateTimeFormat('pt-BR'),
  timeFormat: new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }),
  dateTimeFormat: new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
};

// Função para formatar números em português
export const formatNumber = (number) => {
  return localeConfig.numberFormat.format(number);
};

// Função para formatar datas em português
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return localeConfig.dateFormat.format(dateObj);
};

// Função para formatar horários em português
export const formatTime = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return localeConfig.timeFormat.format(dateObj);
};

// Função para formatar data e hora em português
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return localeConfig.dateTimeFormat.format(dateObj);
};

// Configurar locale global do navegador
export const setupLocale = () => {
  // Forçar locale para português brasileiro
  if (typeof Intl !== 'undefined') {
    // Configurar locale padrão para números
    Intl.NumberFormat.prototype.resolvedOptions = function() {
      return { locale: 'pt-BR' };
    };
    
    // Configurar locale padrão para datas
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      return { locale: 'pt-BR' };
    };
  }
  
  // Configurar document.documentElement.lang
  if (typeof document !== 'undefined') {
    document.documentElement.lang = 'pt-BR';
  }
  
  // Configurar meta charset se necessário
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[charset]');
    if (meta) {
      meta.setAttribute('content', 'UTF-8');
    }
  }
};

// Inicializar configuração de locale
setupLocale();

