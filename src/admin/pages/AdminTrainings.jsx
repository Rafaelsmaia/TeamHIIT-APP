import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { Dumbbell, Plus, X, Edit, Trash2, Upload, Youtube, Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { getYouTubeVideoId } from '../../utils/mediaHelpers.js';
import { createDefaultSections } from '../utils/createDefaultSections.js';

export default function AdminTrainings() {
  const { isDarkMode } = useTheme();
  const [trainings, setTrainings] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    sectionId: '',
    id: '',
    title: '',
    duration: '',
    level: 'Intermediário',
    categories: [],
    imageUrl: '',
    bannerImageUrl: '',
    comingSoon: false,
    modules: []
  });

  const [newVideo, setNewVideo] = useState({ title: '', videoUrl: '' });

  // Carregar seções e treinos
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        // Criar seções padrão se não existirem
        await createDefaultSections();
        
        if (isMounted) {
          await loadSections();
          await loadTrainings();
        }
      } catch (error) {
        console.error('Erro ao inicializar:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const loadSections = async () => {
    try {
      const sectionsSnapshot = await getDocs(collection(db, 'training_sections'));
      const sectionsMap = new Map();
      
      // Usar Map para evitar duplicatas baseado no campo 'id'
      sectionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const sectionId = data.id || doc.id;
        
        // Se já existe uma seção com esse ID, manter apenas a primeira
        if (!sectionsMap.has(sectionId)) {
          sectionsMap.set(sectionId, {
            firestoreId: doc.id,
            id: sectionId,
            ...data
          });
        }
      });
      
      // Converter Map para Array e ordenar por 'order'
      const sectionsList = Array.from(sectionsMap.values()).sort((a, b) => {
        const orderA = a.order || 999;
        const orderB = b.order || 999;
        return orderA - orderB;
      });
      
      setSections(sectionsList);
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      // Se houver erro de bloqueio, mostrar mensagem amigável
      if (error.message?.includes('BLOCKED') || error.code === 'unavailable') {
        alert('Erro de conexão com o banco de dados. Verifique se há bloqueadores de anúncios ativos ou problemas de rede.');
      }
    }
  };

  const loadTrainings = async () => {
    try {
      const trainingsSnapshot = await getDocs(collection(db, 'trainings'));
      const trainingsList = trainingsSnapshot.docs.map(doc => ({
        firestoreId: doc.id, // ID do documento no Firestore
        ...doc.data()
      }));
      setTrainings(trainingsList);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      // Se houver erro de bloqueio, mostrar mensagem amigável
      if (error.message?.includes('BLOCKED') || error.code === 'unavailable') {
        alert('Erro de conexão com o banco de dados. Verifique se há bloqueadores de anúncios ativos ou problemas de rede.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImageType = file.type.startsWith('image/');
    const isImageExt = /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '');
    if (!isImageType && !isImageExt) {
      alert('Por favor, selecione uma imagem (JPEG, PNG, WebP ou GIF).');
      e.target.value = '';
      return;
    }

    const maxSizeMB = 15;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleBannerImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImageType = file.type.startsWith('image/');
    const isImageExt = /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '');
    if (!isImageType && !isImageExt) {
      alert('Por favor, selecione uma imagem (JPEG, PNG, WebP ou GIF).');
      e.target.value = '';
      return;
    }

    const maxSizeMB = 15;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    setBannerImageFile(file);
    setBannerImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const timestamp = Date.now();
      const fileName = `training_covers/${timestamp}_${imageFile.name}`;
      const imageRef = ref(storage, fileName);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  };

  const uploadBannerImage = async () => {
    if (!bannerImageFile) return null;
    try {
      const timestamp = Date.now();
      const fileName = `training_banners/${timestamp}_${bannerImageFile.name}`;
      const imageRef = ref(storage, fileName);
      await uploadBytes(imageRef, bannerImageFile);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      throw error;
    }
  };

  const addVideo = () => {
    if (!newVideo.title.trim() || !newVideo.videoUrl.trim()) {
      alert('Preencha título e URL do vídeo');
      return;
    }

    // Validar URL do YouTube
    const youtubeId = getYouTubeVideoId(newVideo.videoUrl);
    if (!youtubeId) {
      alert('URL do YouTube inválida. Use formato: https://youtu.be/... ou https://www.youtube.com/watch?v=...');
      return;
    }

    const video = {
      title: newVideo.title.trim(),
      videoUrl: newVideo.videoUrl.trim(),
      youtubeId: youtubeId
    };

    setFormData({
      ...formData,
      modules: [...formData.modules, video]
    });

    setNewVideo({ title: '', videoUrl: '' });
  };

  const removeVideo = (index) => {
    setFormData({
      ...formData,
      modules: formData.modules.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sectionId || !formData.id || !formData.title) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Upload da capa Team HIIT se houver
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Upload da capa Dashboard (Treinos para hoje) se houver
      let bannerImageUrl = formData.bannerImageUrl || '';
      if (bannerImageFile) {
        bannerImageUrl = await uploadBannerImage();
      }

      const trainingData = {
        sectionId: formData.sectionId,
        id: formData.id,
        title: formData.title,
        duration: formData.duration,
        level: formData.level,
        categories: formData.categories,
        imageUrl: imageUrl,
        bannerImageUrl: bannerImageUrl,
        comingSoon: formData.comingSoon,
        modules: formData.modules,
        updatedAt: serverTimestamp(),
        createdAt: editingTraining ? undefined : serverTimestamp()
      };

      if (editingTraining) {
        // Atualizar treino existente (usar o ID do documento do Firestore)
        const trainingDocId = editingTraining.firestoreId || editingTraining.id;
        await updateDoc(doc(db, 'trainings', trainingDocId), trainingData);
        alert('Treino atualizado com sucesso!');
      } else {
        // Criar novo treino
        await addDoc(collection(db, 'trainings'), trainingData);
        alert('Treino criado com sucesso!');
      }

      // Limpar formulário
      resetForm();
      loadTrainings();
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      alert('Erro ao salvar treino: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sectionId: '',
      id: '',
      title: '',
      duration: '',
      level: 'Intermediário',
      categories: [],
      imageUrl: '',
      bannerImageUrl: '',
      comingSoon: false,
      modules: []
    });
    setImageFile(null);
    setImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setNewVideo({ title: '', videoUrl: '' });
    setShowForm(false);
    setEditingTraining(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (bannerFileInputRef?.current) bannerFileInputRef.current.value = '';
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setFormData({
      sectionId: training.sectionId || '',
      id: training.id || '',
      title: training.title || '',
      duration: training.duration || '',
      level: training.level || 'Intermediário',
      categories: training.categories || [],
      imageUrl: training.imageUrl || '',
      bannerImageUrl: training.bannerImageUrl || '',
      comingSoon: training.comingSoon || false,
      modules: training.modules || []
    });
    setImagePreview(training.imageUrl || null);
    setBannerImagePreview(training.bannerImageUrl || null);
    setShowForm(true);
  };

  const handleDelete = async (trainingId) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'trainings', trainingId));
      alert('Treino excluído com sucesso!');
      loadTrainings();
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      alert('Erro ao excluir treino: ' + error.message);
    }
  };

  if (loading && trainings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Gerenciamento de Treinos
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Adicione e gerencie módulos de treino
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-5 h-5" />
            Novo Treino
          </button>
        )}
      </div>

      {showForm && (
        <div className={`mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingTraining ? 'Editar Treino' : 'Novo Treino'}
            </h2>
            <button
              onClick={resetForm}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Seção *
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                >
                  <option value="">Selecione uma seção</option>
                  {sections.map(section => (
                    <option key={section.firestoreId || section.id} value={section.id}>{section.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  ID do Treino *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="ex: cardio-dinamico"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: CARDIO DINÂMICO"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duração
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="ex: 6 treinos"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nível
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                  <option value="Intenso">Intenso</option>
                  <option value="Adaptado">Adaptado</option>
                  <option value="Todos os níveis">Todos os níveis</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Em Breve
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comingSoon}
                    onChange={(e) => setFormData({ ...formData, comingSoon: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Marcar como "Em Breve"</span>
                </label>
              </div>
            </div>

            {/* Upload Capa Team HIIT */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Capa Team HIIT (aba Team HIIT)
              </label>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Proporção 3:4. Ex.: 300 x 400px</p>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                    <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                )}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <Upload className="w-5 h-5" /> {imagePreview ? 'Trocar' : 'Selecionar'}
                  </label>
                </div>
              </div>
            </div>

            {/* Upload Capa Dashboard */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Capa Dashboard (Treinos para hoje)
              </label>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Banner 3:2. Ex.: 750 x 500px</p>
              <div className="flex items-center gap-4">
                {bannerImagePreview && (
                  <div className="relative">
                    <img src={bannerImagePreview} alt="Banner" className="w-40 h-[84px] object-cover rounded-lg border border-gray-300" style={{ aspectRatio: '3/2' }} />
                    <button type="button" onClick={() => { setBannerImagePreview(null); setBannerImageFile(null); if (bannerFileInputRef.current) bannerFileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                )}
                <div>
                  <input ref={bannerFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" onChange={handleBannerImageSelect} className="hidden" id="banner-upload" />
                  <label htmlFor="banner-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    <Upload className="w-5 h-5" /> {bannerImagePreview ? 'Trocar' : 'Selecionar'}
                  </label>
                </div>
              </div>
            </div>

            {/* Vídeos */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Vídeos do Módulo ({formData.modules.length})
              </label>
              
              {/* Lista de vídeos */}
              {formData.modules.length > 0 && (
                <div className="mb-4 space-y-2">
                  {formData.modules.map((video, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Youtube className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {video.title}
                          </p>
                          <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {video.videoUrl}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar novo vídeo */}
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="Título do vídeo"
                    className={`px-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <input
                    type="text"
                    value={newVideo.videoUrl}
                    onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                    placeholder="https://youtu.be/..."
                    className={`px-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    type="button"
                    onClick={addVideo}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : editingTraining ? 'Atualizar' : 'Criar Treino'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Treinos */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Treinos Cadastrados ({trainings.length})
          </h2>
          
          {trainings.length === 0 ? (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum treino cadastrado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {trainings.map((training) => (
                <div
                  key={training.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {training.imageUrl && (
                        <img
                          src={training.imageUrl}
                          alt={training.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {training.title}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Seção: {training.sectionId} | {training.modules?.length || 0} vídeos
                        </p>
                        {training.comingSoon && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                            Em Breve
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(training)}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(training.firestoreId)}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
