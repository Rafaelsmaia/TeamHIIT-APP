import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Youtube, Edit2, Clock, Flame, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { getYouTubeVideoId } from '../../utils/mediaHelpers.js';
import { getVideoDuration, getVideoCalories } from '../../utils/VideoDurations.js';
import InstantImage from '../../components/InstantImage.jsx';
import { useTrainingsData } from '../../hooks/useTrainingsData.js';

export default function AdminModuleEdit() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { data: trainingsData, loading: trainingsLoading } = useTrainingsData();

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    duration: '',
    level: 'Intermediário',
    categories: [],
    imageUrl: '',
    bannerImageUrl: '',
    comingSoon: false,
    description: '',
    modules: [],
    sectionId: ''
  });

  const [newVideo, setNewVideo] = useState({ 
    title: '', 
    videoUrl: '',
    duration: '',
    calories: ''
  });
  const [editingVideoIndex, setEditingVideoIndex] = useState(null);
  
  // Estado para o modal de edição de vídeo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVideoData, setEditingVideoData] = useState({
    index: null,
    title: '',
    subtitle: '',
    videoUrl: '',
    youtubeId: '',
    duration: '',
    calories: '',
    description: ''
  });

  // Carregar dados do módulo
  useEffect(() => {
    const loadModule = async () => {
      try {
        if (location.state?.isNew && location.state.training) {
          const training = location.state.training;
          setFormData({
            id: training.id || '',
            title: training.title || '',
            duration: training.duration || '',
            level: training.level || 'Intermediário',
            categories: training.categories || [],
            imageUrl: training.imageUrl || '',
            bannerImageUrl: training.bannerImageUrl || '',
            comingSoon: training.comingSoon || false,
            description: training.description || '',
            modules: training.modules || [],
            sectionId: training.sectionId || location.state?.sectionId || ''
          });
          setImagePreview(training.imageUrl || null);
          setBannerImagePreview(training.bannerImageUrl || null);
          setLoading(false);
          return;
        }

        let moduleData = null;
        let imageUrl = null;

        // 1. Tentar carregar do Firestore primeiro
        try {
          const trainingsSnapshot = await getDocs(collection(db, 'trainings'));
          const trainingDoc = trainingsSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.id === moduleId;
          });

          if (trainingDoc) {
            const data = trainingDoc.data();
            moduleData = {
              id: data.id || moduleId,
              title: data.title || '',
              duration: data.duration || '',
              level: data.level || 'Intermediário',
              categories: data.categories || [],
              imageUrl: data.imageUrl || '',
              bannerImageUrl: data.bannerImageUrl || '',
              comingSoon: data.comingSoon || false,
              description: data.description || '',
              modules: data.modules || [],
              sectionId: data.sectionId || location.state?.sectionId || ''
            };
            imageUrl = data.imageUrl;
          }
        } catch (firestoreError) {
          console.warn('Erro ao carregar do Firestore, tentando outras fontes:', firestoreError);
        }

        // 2. Fallback: usar dados passados via state
        if (!moduleData && location.state?.training) {
          const training = location.state.training;
          moduleData = {
            id: training.id || moduleId,
            title: training.title || '',
            duration: training.duration || '',
            level: training.level || 'Intermediário',
            categories: training.categories || [],
            imageUrl: training.imageUrl || '',
            bannerImageUrl: training.bannerImageUrl || '',
            comingSoon: training.comingSoon || false,
            description: training.description || '',
            modules: training.modules || [],
            sectionId: training.sectionId || location.state?.sectionId || ''
          };
          imageUrl = training.imageUrl ? `/${training.imageUrl}` : null;
        }

        // 3. Fallback: carregar do trainings.js
        if (!moduleData && window.trainingsData?.sections) {
          for (const section of window.trainingsData.sections) {
            const training = section.trainings?.find(t => t.id === moduleId);
            if (training) {
              moduleData = {
                id: training.id || moduleId,
                title: training.title || '',
                duration: training.duration || '',
                level: training.level || 'Intermediário',
                categories: training.categories || [],
                imageUrl: training.imageUrl || '',
                bannerImageUrl: training.bannerImageUrl || '',
                comingSoon: training.comingSoon || false,
                description: '',
                modules: training.modules || [],
                sectionId: training.sectionId || ''
              };
              imageUrl = training.imageUrl ? `/${training.imageUrl}` : null;
              break;
            }
          }
        }

        if (moduleData) {
          setFormData(moduleData);
          setImagePreview(imageUrl);
          setBannerImagePreview(moduleData.bannerImageUrl || null);
        } else {
          alert('Módulo não encontrado. Redirecionando...');
          navigate('/admin/modules');
        }
      } catch (error) {
        console.error('Erro ao carregar módulo:', error);
        alert('Erro ao carregar módulo. Redirecionando...');
        navigate('/admin/modules');
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleId, location.state, navigate]);

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
    if (!imageFile) return formData.imageUrl;

    try {
      const timestamp = Date.now();
      const fileName = `training_covers/${timestamp}_${imageFile.name}`;
      const imageRef = ref(storage, fileName);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      const code = error?.code || '';
      const msg = code ? `[${code}] ${error?.message || ''}` : error?.message;
      throw new Error('Capa: ' + (msg || 'erro no upload'));
    }
  };

  const uploadBannerImage = async () => {
    if (!bannerImageFile) return formData.bannerImageUrl;

    try {
      const timestamp = Date.now();
      const fileName = `training_banners/${timestamp}_${bannerImageFile.name}`;
      const imageRef = ref(storage, fileName);
      await uploadBytes(imageRef, bannerImageFile);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      const code = error?.code || '';
      const msg = code ? `[${code}] ${error?.message || ''}` : error?.message;
      throw new Error('Banner: ' + (msg || 'erro no upload'));
    }
  };

  const addVideo = () => {
    if (!newVideo.title.trim() || !newVideo.videoUrl.trim()) {
      alert('Preencha título e URL do vídeo');
      return;
    }

    const youtubeId = getYouTubeVideoId(newVideo.videoUrl);
    if (!youtubeId) {
      alert('URL do YouTube inválida. Use formato: https://youtu.be/... ou https://www.youtube.com/watch?v=...');
      return;
    }

    // Converter duração para formato padrão se necessário
    let duration = newVideo.duration.trim();
    if (duration && !duration.includes('min')) {
      // Se for apenas número, adicionar "min"
      const numDuration = parseInt(duration, 10);
      if (!isNaN(numDuration)) {
        duration = `${numDuration} min`;
      }
    }

    // Converter calorias para número
    const calories = newVideo.calories.trim() ? parseInt(newVideo.calories.trim(), 10) : 0;
    if (isNaN(calories)) {
      alert('Calorias deve ser um número válido');
      return;
    }

    const video = {
      title: newVideo.title.trim(),
      videoUrl: newVideo.videoUrl.trim(),
      youtubeId: youtubeId,
      duration: duration || undefined,
      calories: calories > 0 ? calories : undefined
    };

    if (editingVideoIndex !== null) {
      // Editar vídeo existente
      const updatedModules = [...formData.modules];
      updatedModules[editingVideoIndex] = video;
      setFormData({ ...formData, modules: updatedModules });
      setEditingVideoIndex(null);
    } else {
      // Adicionar novo vídeo
      setFormData({
        ...formData,
        modules: [...formData.modules, video]
      });
    }

    setNewVideo({ title: '', videoUrl: '', duration: '', calories: '' });
  };

  const removeVideo = (index) => {
    if (confirm('Tem certeza que deseja remover este vídeo?')) {
      setFormData({
        ...formData,
        modules: formData.modules.filter((_, i) => i !== index)
      });
    }
  };

  const editVideo = (index) => {
    const video = formData.modules[index];
    
    // Garantir que temos o youtubeId (extrair da URL se não existir)
    let youtubeId = video.youtubeId;
    if (!youtubeId && video.videoUrl) {
      youtubeId = getYouTubeVideoId(video.videoUrl);
    }
    
    // Processar duração: se existe, extrair apenas o número (remover " min")
    let duration = '';
    if (video.duration) {
      // Se já está no formato "25 min", extrair apenas "25"
      if (typeof video.duration === 'string' && video.duration.includes('min')) {
        duration = video.duration.replace(' min', '').trim();
      } else if (video.duration) {
        duration = video.duration.toString().trim();
      }
    }
    
    // Processar calorias: se existe, usar o valor diretamente
    let calories = '';
    if (video.calories !== undefined && video.calories !== null && video.calories !== '') {
      calories = video.calories.toString().trim();
    }
    
    // Se não existem valores salvos, tentar buscar do VideoDurations.js usando o youtubeId
    if (youtubeId) {
      if (!duration) {
        const defaultDuration = getVideoDuration(youtubeId);
        if (defaultDuration && defaultDuration !== 'N/A') {
          duration = defaultDuration.replace(' min', '').trim(); // Remover " min" para o input
        }
      }
      if (!calories) {
        const defaultCalories = getVideoCalories(youtubeId);
        if (defaultCalories > 0) {
          calories = defaultCalories.toString();
        }
      }
    }
    
    // Debug: log para verificar valores
    console.log('🔍 [AdminModuleEdit] Editando vídeo:', {
      index,
      video,
      youtubeId,
      duration,
      calories,
      hasDuration: !!video.duration,
      hasCalories: video.calories !== undefined
    });
    
    // Abrir modal de edição
    setEditingVideoData({
      index: index,
      title: video.title || '',
      subtitle: video.subtitle || '',
      videoUrl: video.videoUrl || '',
      youtubeId: youtubeId || '',
      duration: duration,
      calories: calories,
      description: video.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveVideoEdit = () => {
    if (!editingVideoData.title.trim()) {
      alert('Preencha o título do vídeo');
      return;
    }

    // Converter duração para formato padrão se necessário
    let duration = editingVideoData.duration.trim();
    if (duration && !duration.includes('min')) {
      const numDuration = parseInt(duration, 10);
      if (!isNaN(numDuration)) {
        duration = `${numDuration} min`;
      }
    }

    // Converter calorias para número
    const calories = editingVideoData.calories.trim() ? parseInt(editingVideoData.calories.trim(), 10) : 0;
    if (editingVideoData.calories.trim() && isNaN(calories)) {
      alert('Calorias deve ser um número válido');
      return;
    }

    const updatedVideo = {
      title: editingVideoData.title.trim(),
      subtitle: editingVideoData.subtitle.trim() || undefined,
      videoUrl: editingVideoData.videoUrl.trim(),
      youtubeId: editingVideoData.youtubeId || getYouTubeVideoId(editingVideoData.videoUrl),
      duration: duration || undefined,
      calories: calories > 0 ? calories : undefined,
      description: editingVideoData.description.trim() || undefined
    };

    // Atualizar o vídeo na lista
    const updatedModules = [...formData.modules];
    updatedModules[editingVideoData.index] = updatedVideo;
    setFormData({ ...formData, modules: updatedModules });

    // Fechar modal
    setIsEditModalOpen(false);
    setEditingVideoData({
      index: null,
      title: '',
      subtitle: '',
      videoUrl: '',
      youtubeId: '',
      duration: '',
      calories: '',
      description: ''
    });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVideoData({
      index: null,
      title: '',
      subtitle: '',
      videoUrl: '',
      youtubeId: '',
      duration: '',
      calories: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Preencha o título do módulo');
      return;
    }

    try {
      setSaving(true);

      // Upload da capa Team HIIT se houver
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Upload da capa Dashboard (Treinos para hoje) se houver
      let bannerImageUrl = formData.bannerImageUrl;
      if (bannerImageFile) {
        bannerImageUrl = await uploadBannerImage();
      }

      const moduleData = {
        id: formData.id,
        title: formData.title,
        duration: formData.duration,
        level: formData.level,
        categories: formData.categories,
        imageUrl: imageUrl,
        bannerImageUrl: bannerImageUrl || '',
        comingSoon: formData.comingSoon,
        description: formData.description,
        modules: formData.modules,
        sectionId: formData.sectionId || location.state?.sectionId || '',
        updatedAt: serverTimestamp()
      };

      // Atualizar no Firestore
      const trainingsSnapshot = await getDocs(collection(db, 'trainings'));
      const trainingDoc = trainingsSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.id === moduleId;
      });

      if (trainingDoc) {
        await updateDoc(doc(db, 'trainings', trainingDoc.id), moduleData);
        alert('Módulo atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'trainings'), moduleData);
        alert('Módulo criado no Firestore com sucesso!');
      }

      navigate('/admin/modules');
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      const code = error?.code || '';
      const msg = error?.message || String(error);
      if (code === 'permission-denied' || msg.includes('permission-denied')) {
        alert('Sem permissão para salvar. Verifique se sua conta tem isAdmin: true em Firestore (coleção users) e se você está logado.');
      } else if (code === 'unauthenticated' || msg.includes('unauthenticated')) {
        alert('Você precisa estar logado para salvar. Faça login e tente novamente.');
      } else if (code === 'storage/unauthorized' || msg.includes('storage')) {
        alert('Erro no upload da imagem. Verifique se está logado e se as regras do Storage permitem escrita em training_covers e training_banners.');
      } else {
        alert('Erro ao salvar módulo: ' + msg);
      }
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/modules')}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Editar Módulo
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {formData.title || 'Carregando...'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dados do Módulo
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Título do Módulo *
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Seção do Módulo
                    </label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      disabled={trainingsLoading || !trainingsData?.sections?.length}
                    >
                      <option value="">
                        {trainingsLoading
                          ? 'Carregando seções...'
                          : 'Selecione uma seção'}
                      </option>
                      {trainingsData?.sections
                        ?.filter(
                          (section) =>
                            section.title !== 'CANAIS DE SUPORTE' &&
                            section.title !== 'CRONOGRAMAS SEMANAIS'
                        )
                        .map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Escreva uma descrição sobre o módulo..."
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.comingSoon}
                      onChange={(e) => setFormData({ ...formData, comingSoon: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Marcar como "Em Breve"
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Vídeos do Módulo */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Vídeos do Módulo ({formData.modules.length})
              </h2>

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
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Youtube className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {video.title}
                          </p>
                          {video.subtitle && (
                            <p className={`text-sm truncate mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {video.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {video.videoUrl}
                            </p>
                            {video.duration && (
                              <span className={`flex items-center gap-1 text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Clock className="w-3 h-3" />
                                {video.duration.includes('min') ? video.duration : `${video.duration} min`}
                              </span>
                            )}
                            {video.calories && (
                              <span className={`flex items-center gap-1 text-xs whitespace-nowrap ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                <Flame className="w-3 h-3" />
                                {video.calories} kcal
                              </span>
                            )}
                          </div>
                          {video.description && (
                            <p className={`text-xs mt-1 line-clamp-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => editVideo(index)}
                          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
                          title="Editar vídeo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar/Editar vídeo */}
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                <div className="space-y-3">
                  {/* Linha 1: Título e URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      onChange={(e) => {
                        const url = e.target.value;
                        setNewVideo({ ...newVideo, videoUrl: url });
                        
                        // Auto-preencher duração e calorias se disponíveis
                        const youtubeId = getYouTubeVideoId(url);
                        if (youtubeId && !newVideo.duration && !newVideo.calories) {
                          const defaultDuration = getVideoDuration(youtubeId);
                          const defaultCalories = getVideoCalories(youtubeId);
                          
                          if (defaultDuration && defaultDuration !== 'N/A') {
                            setNewVideo(prev => ({
                              ...prev,
                              videoUrl: url,
                              duration: defaultDuration.replace(' min', ''),
                              calories: defaultCalories > 0 ? defaultCalories.toString() : ''
                            }));
                          } else {
                            setNewVideo(prev => ({
                              ...prev,
                              videoUrl: url,
                              calories: defaultCalories > 0 ? defaultCalories.toString() : ''
                            }));
                          }
                        }
                      }}
                      placeholder="https://youtu.be/..."
                      className={`px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* Linha 2: Duração e Calorias */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Duração (minutos)
                      </label>
                      <div className="relative">
                        <Clock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="number"
                          value={newVideo.duration}
                          onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                          placeholder="ex: 25"
                          min="0"
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Calorias (kcal)
                      </label>
                      <div className="relative">
                        <Flame className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} />
                        <input
                          type="number"
                          value={newVideo.calories}
                          onChange={(e) => setNewVideo({ ...newVideo, calories: e.target.value })}
                          placeholder="ex: 450"
                          min="0"
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão Adicionar/Salvar */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addVideo}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-1 ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {editingVideoIndex !== null ? (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar Alterações
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar Vídeo
                        </>
                      )}
                    </button>
                    {editingVideoIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVideoIndex(null);
                          setNewVideo({ title: '', videoUrl: '', duration: '', calories: '' });
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Capa */}
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Capa Team HIIT
              </h2>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Aparece nos cards da aba Team HIIT.
              </p>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    <InstantImage
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                      darkMode={isDarkMode}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {!imagePreview && (
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <Upload className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Proporção: 3:4</p>
                    <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ex.: 300 x 400px</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="cover-upload" />
                    <label htmlFor="cover-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Upload className="w-4 h-4" /> Selecionar
                    </label>
                  </div>
                )}
                {imagePreview && (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="cover-upload-change" />
                    <label htmlFor="cover-upload-change" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors w-full justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Upload className="w-4 h-4" /> Trocar Imagem
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Capa Dashboard (Treinos para hoje) */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Capa Dashboard
              </h2>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Banner em &quot;Treinos para hoje&quot; no Dashboard. Proporção 3:2.
              </p>
              <div className="space-y-4">
                {bannerImagePreview && (
                  <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    <InstantImage
                      src={bannerImagePreview}
                      alt="Banner"
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                      darkMode={isDarkMode}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImagePreview(null);
                        setBannerImageFile(null);
                        if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {!bannerImagePreview && (
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <Upload className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Proporção: 3:2</p>
                    <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ex.: 750 x 500px</p>
                    <input ref={bannerFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" onChange={handleBannerImageSelect} className="hidden" id="banner-upload" />
                    <label htmlFor="banner-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Upload className="w-4 h-4" /> Selecionar
                    </label>
                  </div>
                )}
                {bannerImagePreview && (
                  <div>
                    <input ref={bannerFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" onChange={handleBannerImageSelect} className="hidden" id="banner-upload-change" />
                    <label htmlFor="banner-upload-change" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors w-full justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Upload className="w-4 h-4" /> Trocar Banner
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/modules')}
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

      {/* Modal de Edição de Vídeo */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Header do Modal */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Edit2 className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Editar Vídeo
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Modifique as informações do vídeo
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título *
                </label>
                <input
                  type="text"
                  value={editingVideoData.title}
                  onChange={(e) => setEditingVideoData({ ...editingVideoData, title: e.target.value })}
                  placeholder="ex: Treino 1"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />
              </div>

              {/* Subtítulo */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={editingVideoData.subtitle}
                  onChange={(e) => setEditingVideoData({ ...editingVideoData, subtitle: e.target.value })}
                  placeholder="ex: Treino de força e resistência"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* URL do YouTube */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  URL do YouTube *
                </label>
                <div className="relative">
                  <Youtube className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <input
                    type="text"
                    value={editingVideoData.videoUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingVideoData({ 
                        ...editingVideoData, 
                        videoUrl: url,
                        youtubeId: getYouTubeVideoId(url) || editingVideoData.youtubeId
                      });
                      
                      // Auto-preencher duração e calorias se disponíveis
                      const youtubeId = getYouTubeVideoId(url);
                      if (youtubeId && (!editingVideoData.duration || !editingVideoData.calories)) {
                        const defaultDuration = getVideoDuration(youtubeId);
                        const defaultCalories = getVideoCalories(youtubeId);
                        
                        if (defaultDuration && defaultDuration !== 'N/A' && !editingVideoData.duration) {
                          setEditingVideoData(prev => ({
                            ...prev,
                            videoUrl: url,
                            youtubeId: youtubeId,
                            duration: defaultDuration.replace(' min', '')
                          }));
                        }
                        if (defaultCalories > 0 && !editingVideoData.calories) {
                          setEditingVideoData(prev => ({
                            ...prev,
                            videoUrl: url,
                            youtubeId: youtubeId,
                            calories: defaultCalories.toString()
                          }));
                        }
                      }
                    }}
                    placeholder="https://youtu.be/..."
                    className={`w-full pl-11 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
              </div>

              {/* Duração e Calorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duração (minutos)
                  </label>
                  <div className="relative">
                    <Clock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      value={editingVideoData.duration}
                      onChange={(e) => setEditingVideoData({ ...editingVideoData, duration: e.target.value })}
                      placeholder="ex: 25"
                      min="0"
                      className={`w-full pl-11 pr-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Calorias (kcal)
                  </label>
                  <div className="relative">
                    <Flame className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} />
                    <input
                      type="number"
                      value={editingVideoData.calories}
                      onChange={(e) => setEditingVideoData({ ...editingVideoData, calories: e.target.value })}
                      placeholder="ex: 450"
                      min="0"
                      className={`w-full pl-11 pr-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descrição
                </label>
                <div className="relative">
                  <FileText className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <textarea
                    value={editingVideoData.description}
                    onChange={(e) => setEditingVideoData({ ...editingVideoData, description: e.target.value })}
                    placeholder="Descreva o conteúdo deste treino..."
                    rows={4}
                    className={`w-full pl-11 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveVideoEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
