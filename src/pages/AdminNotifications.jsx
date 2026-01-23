import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Users, Bell, AlertCircle } from 'lucide-react';

export function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Verificar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  // Contar usuários com tokens FCM
  useEffect(() => {
    const countUsers = async () => {
      try {
        const tokensSnapshot = await getDocs(collection(db, 'fcm_tokens'));
        setUserCount(tokensSnapshot.size);
      } catch (error) {
        console.error('Erro ao contar usuários:', error);
      }
    };
    countUsers();
  }, []);

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      alert('Preencha título e mensagem');
      return;
    }

    setIsLoading(true);

    try {
      // Salvar notificação no Firestore para processamento
      await addDoc(collection(db, 'notifications_queue'), {
        title: title.trim(),
        body: body.trim(),
        createdAt: serverTimestamp(),
        status: 'pending',
        sentBy: 'admin'
      });

      alert('Notificação enviada com sucesso!');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      alert('Erro ao enviar notificação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto p-6">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Bell className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Enviar Notificações
            </h1>
          </div>

          {/* Estatísticas */}
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4 mb-6`}>
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {userCount} usuários cadastrados para notificações
              </span>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Título da Notificação
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo treino disponível!"
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                maxLength={50}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {title.length}/50 caracteres
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mensagem
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Confira o novo treino de pernas que acabou de ser adicionado!"
                rows={4}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                maxLength={200}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {body.length}/200 caracteres
              </p>
            </div>

            {/* Aviso */}
            <div className={`${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-50'} border ${isDarkMode ? 'border-yellow-700' : 'border-yellow-200'} rounded-lg p-4`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mt-0.5`} />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Importante
                  </p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    As notificações serão enviadas para todos os usuários que ativaram as notificações. 
                    Use com moderação para manter o engajamento.
                  </p>
                </div>
              </div>
            </div>

            {/* Botão de envio */}
            <button
              onClick={sendNotification}
              disabled={isLoading || !title.trim() || !body.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isLoading || !title.trim() || !body.trim()
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Enviar Notificação
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}














