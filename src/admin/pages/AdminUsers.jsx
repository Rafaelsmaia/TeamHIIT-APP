import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Users, Search, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export default function AdminUsers() {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const adminUsers = users.filter(user => user.isAdmin === true);
  const regularUsers = users.filter(user => !user.isAdmin);

  const filteredUsers = (showOnlyAdmins ? adminUsers : users).filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAdminAccess = async (userId, currentAdminStatus) => {
    if (!confirm(`Tem certeza que deseja ${currentAdminStatus ? 'remover' : 'conceder'} acesso de administrador para este usuário?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentAdminStatus,
        updatedAt: new Date()
      });
      
      // Atualizar estado local
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !currentAdminStatus } : user
      ));
      
      alert(`Acesso de administrador ${!currentAdminStatus ? 'concedido' : 'removido'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar acesso admin:', error);
      alert('Erro ao atualizar acesso: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Gerenciamento de Usuários
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Total: {users.length} usuários cadastrados
          </p>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isDarkMode 
              ? 'bg-purple-900/30 text-purple-300 border border-purple-700' 
              : 'bg-purple-100 text-purple-800 border border-purple-200'
          }`}>
            <Shield className="w-4 h-4 inline mr-1" />
            {adminUsers.length} Administrador{adminUsers.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Seção de Administradores */}
      {adminUsers.length > 0 && (
        <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Usuários com Acesso ao Painel Admin
              </h2>
            </div>
            <button
              onClick={() => setShowOnlyAdmins(!showOnlyAdmins)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showOnlyAdmins
                  ? isDarkMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-600 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showOnlyAdmins ? 'Mostrar Todos' : 'Mostrar Apenas Admins'}
            </button>
          </div>
          
          <div className="space-y-3">
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-purple-600' : 'bg-purple-200'
                  }`}>
                    <Shield className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.name || 'Sem nome'}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.email || 'Sem email'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleAdminAccess(user.id, true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  <ShieldOff className="w-4 h-4 inline mr-1" />
                  Remover Admin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Busca */}
      <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Buscar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Usuário
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
                          <Users className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.name || 'Sem nome'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {user.email || 'Sem email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.isAdmin && <Shield className="w-3 h-3" />}
                        {user.isAdmin ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {!user.isAdmin ? (
                          <button
                            onClick={() => toggleAdminAccess(user.id, false)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              isDarkMode 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3 inline mr-1" />
                            Tornar Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAdminAccess(user.id, true)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              isDarkMode 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            <ShieldOff className="w-3 h-3 inline mr-1" />
                            Remover Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
