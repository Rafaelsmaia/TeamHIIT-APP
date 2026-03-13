import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTrainingsData } from '../../hooks/useTrainingsData.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Edit, Dumbbell, Plus } from 'lucide-react';
import InstantImage from '../../components/InstantImage.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function AdminModules() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { data: trainingsData, loading: trainingsLoading } = useTrainingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [firestoreTrainings, setFirestoreTrainings] = useState([]);
  const [loadingFirestore, setLoadingFirestore] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSections, setReorderSections] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Carregar treinos do Firestore
  useEffect(() => {
    const loadFirestoreTrainings = async () => {
      try {
        const trainingsSnapshot = await getDocs(collection(db, 'trainings'));
        const trainingsList = trainingsSnapshot.docs.map(doc => ({
          firestoreId: doc.id,
          ...doc.data()
        }));
        setFirestoreTrainings(trainingsList);
      } catch (error) {
        console.error('Erro ao carregar treinos do Firestore:', error);
      } finally {
        setLoadingFirestore(false);
      }
    };

    loadFirestoreTrainings();
  }, []);

  // Combinar dados do Firestore com trainings.js
  const sectionsToDisplay = trainingsData?.sections?.filter(
    (section) => section.title !== "CANAIS DE SUPORTE" && section.title !== "CRONOGRAMAS SEMANAIS"
  ).map(section => {
    // Para cada seção, combinar treinos do trainings.js com os do Firestore
    const trainingsFromJs = section.trainings?.filter(
      (training) => training.id !== "canais-suporte-card" && 
                   training.title !== "SUPORTE" && 
                   training.title !== "CANAIS DE SUPORTE"
    ) || [];

    // Adicionar treinos do Firestore que pertencem a esta seção
    const trainingsFromFirestore = firestoreTrainings
      .filter(
      training => training.sectionId === section.id
      )
      .slice()
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 9999;
        const orderB = typeof b.order === 'number' ? b.order : 9999;
        return orderA - orderB;
      });

    // Combinar e remover duplicatas (priorizar Firestore)
    const allTrainings = [...trainingsFromFirestore];
    trainingsFromJs.forEach(jsTraining => {
      if (!allTrainings.find(t => t.id === jsTraining.id)) {
        allTrainings.push(jsTraining);
      }
    });

    return {
      ...section,
      trainings: allTrainings
    };
  }) || [];

  // Filtrar treinos por busca
  const filteredSections = sectionsToDisplay.map(section => ({
    ...section,
    trainings: section.trainings.filter(training =>
      training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.trainings.length > 0);

  const handleCreateModule = () => {
    const firstSection = sectionsToDisplay[0];
    const sectionId = firstSection?.id || 'custom-section';
    const newId = `${sectionId}-custom-${Date.now()}`;

    const emptyTraining = {
      id: newId,
      title: '',
      duration: '',
      level: 'Intermediário',
      categories: [],
      imageUrl: '',
      bannerImageUrl: '',
      comingSoon: false,
      description: '',
      modules: [],
      sectionId,
    };

    navigate(`/admin/modules/edit/${newId}`, {
      state: {
        training: emptyTraining,
        sectionId,
        sectionTitle: firstSection?.title || '',
        isNew: true,
      },
    });
  };

  const startReorder = () => {
    setIsReordering(true);
    setReorderSections(
      sectionsToDisplay.map((section) => ({
        id: section.id,
        title: section.title,
        trainings: [...section.trainings],
      }))
    );
  };

  const cancelReorder = () => {
    setIsReordering(false);
    setReorderSections([]);
  };

  const moveTraining = (sectionId, index, direction) => {
    setReorderSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const newTrainings = [...section.trainings];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newTrainings.length) return section;
        const temp = newTrainings[index];
        newTrainings[index] = newTrainings[newIndex];
        newTrainings[newIndex] = temp;
        return { ...section, trainings: newTrainings };
      })
    );
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const batch = writeBatch(db);

      reorderSections.forEach((section) => {
        section.trainings.forEach((training, index) => {
          const fsDoc = firestoreTrainings.find(
            (t) => t.id === training.id && t.firestoreId
          );
          if (!fsDoc) return;
          const ref = doc(db, 'trainings', fsDoc.firestoreId);
          batch.update(ref, { order: index });
        });
      });

      await batch.commit();
      alert('Ordem dos módulos atualizada com sucesso!');
      setIsReordering(false);
    } catch (error) {
      console.error('Erro ao salvar ordem dos módulos:', error);
      alert('Erro ao salvar a nova ordem. Tente novamente.');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleEditModule = (training, section) => {
    navigate(`/admin/modules/edit/${training.id}`, {
      state: {
        training,
        sectionId: section.id,
        sectionTitle: section.title
      }
    });
  };

  if (trainingsLoading || loadingFirestore) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando módulos..." />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Gerenciamento de Módulos
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Edite módulos, treinos, capas e configurações
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {sectionsToDisplay.length > 0 && (
            <button
              type="button"
              onClick={handleCreateModule}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isReordering}
            >
              <Plus className="w-4 h-4" />
              Novo módulo
            </button>
          )}
          {sectionsToDisplay.length > 0 && (
            <button
              type="button"
              onClick={isReordering ? handleSaveOrder : startReorder}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } ${savingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={savingOrder}
            >
              {isReordering ? 'Salvar ordem' : 'Reordenar'}
            </button>
          )}
          {isReordering && (
            <button
              type="button"
              onClick={cancelReorder}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
              }`}
              disabled={savingOrder}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {!isReordering && (
        <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <input
            type="text"
            placeholder="Buscar módulo por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      )}

      {/* Seções de Módulos */}
      {!isReordering && filteredSections.length === 0 ? (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
          <Dumbbell className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {searchTerm ? 'Nenhum módulo encontrado' : 'Nenhum módulo cadastrado'}
          </h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            {searchTerm ? 'Tente buscar com outros termos' : 'Os módulos aparecerão aqui quando cadastrados'}
          </p>
        </div>
      ) : !isReordering ? (
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {section.title}
                </h2>
                {section.description && (
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {section.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.trainings.map((training) => (
                  <div
                    key={training.id}
                    className={`relative group rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} hover:shadow-xl`}
                  >
                    {/* Imagem de Capa */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden">
                      <InstantImage
                        src={training.imageUrl || "/IMAGES/CAPAS TEAM HIIT/capa TH.png"}
                        alt={training.title}
                        className="w-full h-full"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        darkMode={isDarkMode}
                      />
                      
                      {/* Overlay escuro no hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        {/* Botão de Editar - aparece no hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditModule(training, section);
                          }}
                          className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
                        >
                          <Edit className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Badge "EM BREVE" se aplicável */}
                      {training.comingSoon && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 px-3 py-1 rounded-lg shadow-lg">
                          <span className="text-white font-bold text-xs tracking-wider">
                            EM BREVE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Informações do Módulo */}
                    <div className="p-4">
                      <h3 className={`text-lg font-bold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {training.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {training.duration || 'N/A'}
                        </span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {training.modules?.length || 0} vídeos
                        </span>
                      </div>
                      {training.level && (
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {training.level}
                        </span>
                      )}
                    </div>

                    {/* Botão de Editar sempre visível (mobile) */}
                    <div className="md:hidden p-4 pt-0">
                      <button
                        onClick={() => handleEditModule(training, section)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Editar Módulo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {reorderSections.map((section) => (
            <div key={section.id}>
              <h2 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {section.title}
              </h2>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {section.trainings.map((training, index) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm w-6 text-right`}>
                        {index + 1}.
                      </span>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                        {training.title || training.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveTraining(section.id, index, -1)}
                        className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        disabled={index === 0 || savingOrder}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTraining(section.id, index, 1)}
                        className={`px-2 py-1 text-xs rounded-md border ${isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        disabled={index === section.trainings.length - 1 || savingOrder}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
