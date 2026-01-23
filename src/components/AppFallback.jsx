// FALLBACK DEFINITIVO - SEMPRE FUNCIONA
// Timestamp: 2025-01-09-22-45-00

const AppFallback = () => {
  console.log('🚨 [FALLBACK] Renderizando fallback de emergência...');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ff0000',
      color: '#ffffff',
      padding: '20px',
      fontSize: '18px',
      fontWeight: 'bold',
      textAlign: 'center',
      border: '5px solid #00ff00',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999
    }}>
      <h1 style={{ color: '#ffffff', margin: '0 0 20px 0', fontSize: '24px' }}>
        🚨 FALLBACK DE EMERGÊNCIA 🚨
      </h1>
      <p style={{ color: '#ffffff', margin: '10px 0', fontSize: '16px' }}>
        Se você vê esta tela, o app está funcionando!
      </p>
      <p style={{ color: '#ffffff', margin: '10px 0', fontSize: '14px' }}>
        Timestamp: {new Date().toLocaleTimeString()}
      </p>
      <p style={{ color: '#ffffff', margin: '10px 0', fontSize: '12px' }}>
        Esta é uma tela de fallback que sempre funciona.
      </p>
    </div>
  );
};

export default AppFallback;
