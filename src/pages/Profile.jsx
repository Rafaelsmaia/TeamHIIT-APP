import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, updateProfile, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit3, LogOut, Crown, Heart, MessageCircle, Image as ImageIcon, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { usePWAAuth } from '../hooks/UsePWAAuth.js';
import ProfilePhoto from '../components/ProfilePhoto.jsx';
import BottomNavigation from '../components/ui/BottomNavigation.jsx';
import CircularProfileCropModal from '../components/CircularProfileCropModal.jsx';
import { PlatformConfig } from '../config/platform.js';
import { openFileInput, alertFileInputUnavailable } from '../utils/fileInput.js';

function Profile() {
  const auth = getAuth();
  const storage = getStorage();
  const navigate = useNavigate();
  
  // Usar o hook de tema
  const { isDarkMode } = useTheme();
  
  // Scroll para o topo quando a página é carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  // CONSUMIR O ESTADO GLOBAL DO usePWAAuth
  const { currentUser: globalCurrentUser, loading: globalLoading, isSubscriber, refreshUserProfile } = usePWAAuth();

  const [currentUser, setCurrentUser] = useState(globalCurrentUser);
  const [userStats, setUserStats] = useState({
    completedWorkouts: 0,
    completedWeeks: 0,
    achievements: 0
  });
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(globalLoading);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    displayName: globalCurrentUser?.displayName || '',
    email: globalCurrentUser?.email || '',
    phone: '',
    photoURL: globalCurrentUser?.photoURL || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const photoOptionsRef = useRef(null);
  // Ref para rastrear se há uma foto sendo editada (independente de re-renders)
  const isEditingPhotoRef = useRef(false);
  
  // Estado para controlar o modal de crop circular
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState(null);

  // Função estável para buscar posts do usuário
  const fetchUserPosts = useCallback(async (userId) => {
    try {
      // Query simplificada sem orderBy para melhor performance
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        limit(6) // Limitar a 6 postagens para o grid
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ordenar localmente se necessário (mais rápido que orderBy no Firebase)
      posts.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return timeB - timeA;
      });
      
      setUserPosts(posts);
    } catch (error) {
      console.error('Erro ao buscar postagens do usuário:', error);
      
      // Se houver erro, definir array vazio (não crítico para o perfil)
      setUserPosts([]);
    }
  }, []);

  // useEffect 1: Sincronizar dados do usuário (reage a mudanças em photoURL e displayName)
  // IMPORTANTE: NÃO incluir previewURL ou editMode nas dependências para evitar loops
  useEffect(() => {
    // Sincronizar loading sempre
    setLoading(globalLoading);

    // Se ainda estiver carregando, aguardar (não fazer nada)
    if (globalLoading) {
      return;
    }

    // Após o carregamento terminar, verificar se há usuário
    if (!globalCurrentUser) {
      // Se não há usuário global após carregar, redirecionar para login
      navigate('/login');
      return;
    }

    // Sincronizar estado local com o estado global
    setCurrentUser(globalCurrentUser);
    
    // Atualizar formData com dados do usuário global (fonte única da verdade)
    // IMPORTANTE: SEMPRE proteger blob URLs (previews locais) - nunca sobrescrever
    setFormData(prev => {
      // Verificar se o photoURL atual é um blob URL (preview local)
      // Blob URLs são temporários e sempre devem ser preservados se existirem
      const isBlobURL = prev.photoURL && typeof prev.photoURL === 'string' && prev.photoURL.startsWith('blob:');
      
      // Se o photoURL atual é um blob URL OU estamos editando uma foto (ref), 
      // SEMPRE manter - nunca sobrescrever
      // Isso garante que previews locais não sejam perdidos mesmo em re-renders
      let newPhotoURL;
      if (isBlobURL || isEditingPhotoRef.current) {
        // SEMPRE preservar blob URLs ou se estamos editando - são previews locais que não devem ser sobrescritos
        newPhotoURL = prev.photoURL;
        console.log('🔒 Protegendo photoURL durante edição. Blob:', isBlobURL, 'Ref:', isEditingPhotoRef.current, 'URL:', prev.photoURL?.substring(0, 50));
      } else {
        // Se não há blob URL e não estamos editando, usar photoURL do globalCurrentUser
        // Se globalCurrentUser.photoURL for undefined, manter o prev.photoURL
        newPhotoURL = globalCurrentUser.photoURL !== undefined 
          ? (globalCurrentUser.photoURL || '') 
          : (prev.photoURL || '');
      }
      
      return {
      ...prev,
      displayName: globalCurrentUser.displayName || prev.displayName || '',
      email: globalCurrentUser.email || prev.email || '',
        photoURL: newPhotoURL
      };
    });

    console.log('📥 Profile sincronizado com usePWAAuth:', {
      'photoURL': globalCurrentUser.photoURL,
      'displayName': globalCurrentUser.displayName
    });
  }, [globalCurrentUser?.uid, globalCurrentUser?.photoURL, globalCurrentUser?.displayName, globalLoading, navigate]);

  // useEffect 2: Carregar dados do Firestore (só quando o uid mudar, para evitar recarregar desnecessariamente)
  useEffect(() => {
    if (!globalCurrentUser?.uid || globalLoading) {
      return;
    }

    // Carregar userStats do Firestore
    const loadUserStats = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', globalCurrentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserStats({
            completedWorkouts: userData.completedWorkouts || 0,
            completedWeeks: userData.completedWeeks || 0,
            achievements: userData.achievements || 0
          });
          
          // Atualizar phone se existir no Firestore
          if (userData.phone) {
            setFormData(prev => ({ ...prev, phone: userData.phone }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar stats do usuário:', error);
      }
    };

    // Carregar dados do Firestore e posts
    loadUserStats();
    fetchUserPosts(globalCurrentUser.uid);
  }, [globalCurrentUser?.uid, globalLoading, fetchUserPosts]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log('📷 handleFileChange chamado. File:', file?.name, 'Type:', file?.type);
    
    if (file) {
      // Validar se é uma imagem
      if (!file.type.startsWith('image/')) {
        setMessage('Por favor, selecione uma imagem válida.');
        return;
      }

      console.log('✅ Arquivo válido selecionado. Preparando modal de crop circular...');

      // Limpar preview anterior se existir
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
      }

      // Primeiro definir o arquivo, depois abrir o modal
      setFileToCrop(file);
      
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    } else {
      console.warn('⚠️ Nenhum arquivo selecionado');
    }
  };

  // Ref para rastrear se já tentamos abrir o modal com este arquivo
  const openedFileRef = useRef(null);

  // Abrir modal quando fileToCrop for definido (mas apenas uma vez por arquivo)
  useEffect(() => {
    // Só abrir o modal se tiver fileToCrop E o modal não estiver aberto
    if (fileToCrop && !cropModalOpen) {
      // Verificar se este arquivo já foi processado
      const fileId = fileToCrop.name + fileToCrop.size + fileToCrop.lastModified;
      if (openedFileRef.current === fileId) {
        console.log('⏭️ Arquivo já foi processado, ignorando');
        return;
      }
      
      console.log('🔄 fileToCrop definido, abrindo modal em 200ms...', fileToCrop.name);
      openedFileRef.current = fileId;
      
      // Delay maior para garantir que o componente do modal esteja completamente pronto
      // e que não haja interferência de outros useEffects
      const timer = setTimeout(() => {
        console.log('✅ Abrindo modal agora. fileToCrop:', !!fileToCrop, 'cropModalOpen:', cropModalOpen);
        // Verificar novamente antes de abrir para garantir que o arquivo ainda existe
        if (fileToCrop) {
          setCropModalOpen(true);
          console.log('✅ Modal aberto');
        } else {
          console.warn('⚠️ Arquivo foi removido antes de abrir o modal');
          openedFileRef.current = null;
        }
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
    // REMOVER a condição else if que fechava o modal - isso estava causando o fechamento automático
    // O modal só deve fechar quando o usuário solicitar explicitamente ou quando handleCropCancel/handleCropConfirm for chamado
  }, [fileToCrop, cropModalOpen]);

  const handleCropCancel = () => {
    console.log('❌ handleCropCancel chamado - fechando modal');
    // Primeiro fechar o modal
    setCropModalOpen(false);
    // Limpar fileToCrop e ref após um delay maior para garantir que o modal feche completamente
    setTimeout(() => {
      setFileToCrop(null);
      openedFileRef.current = null;
      setMessage('');
      console.log('✅ Modal fechado e estado limpo');
    }, 200);
  };

  const handleCropConfirm = async (croppedFile) => {
    console.log('✅ Imagem recortada confirmada:', croppedFile.name);
    
    // Fechar modal primeiro
    setCropModalOpen(false);
    setFileToCrop(null);
    openedFileRef.current = null;
    
    if (!currentUser) {
      console.warn('⚠️ handleCropConfirm: currentUser é null');
      return;
    }

    try {
      setUploading(true);
      // Não mostrar mensagem durante o upload - fazer silenciosamente
      
      // Upload da foto imediatamente
      console.log('📤 Iniciando upload da foto recortada...');
      const timestamp = Date.now();
      const fileExtension = croppedFile.name.split('.').pop() || 'jpg';
      const uniqueFileName = `profile_${timestamp}.${fileExtension}`;
      const photoRef = ref(storage, `profile_pictures/${currentUser.uid}/${uniqueFileName}`);
      await uploadBytes(photoRef, croppedFile);
      const newPhotoURL = await getDownloadURL(photoRef);
      console.log('✅ Foto enviada com sucesso:', newPhotoURL);
      
      // Atualizar displayName e photoURL no Firebase Authentication
      console.log('📸 Atualizando perfil no Firebase Auth com photoURL:', newPhotoURL);
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: newPhotoURL
      });
      console.log('✅ Firebase Auth atualizado');

      // Recarregar usuário do Firebase Auth IMEDIATAMENTE após updateProfile
      await auth.currentUser.reload();
      const updatedFirebaseUser = auth.currentUser;
      console.log('🔄 Usuário recarregado. Nova photoURL:', updatedFirebaseUser.photoURL);

      // Verificar se a photoURL foi realmente atualizada
      if (updatedFirebaseUser.photoURL !== newPhotoURL) {
        console.warn('⚠️ photoURL não corresponde! Tentando novamente...');
        await updateProfile(updatedFirebaseUser, {
          photoURL: newPhotoURL
        });
        await updatedFirebaseUser.reload();
      }

      // Atualizar dados no Firestore com a URL confirmada
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const confirmedPhotoURL = updatedFirebaseUser.photoURL || newPhotoURL;

      if (userDocSnap.exists()) {
        await setDoc(userDocRef, {
          name: formData.displayName,
          displayName: formData.displayName,
          photoURL: confirmedPhotoURL,
          phone: formData.phone,
          updatedAt: new Date()
        }, { merge: true });
        console.log('✅ Firestore atualizado com photoURL:', confirmedPhotoURL);
      } else {
        await setDoc(userDocRef, {
          email: currentUser.email,
          name: formData.displayName,
          displayName: formData.displayName,
          photoURL: confirmedPhotoURL,
          phone: formData.phone,
          createdAt: new Date(),
          completedWorkouts: 0,
          completedWeeks: 0,
          achievements: 0
        });
        console.log('✅ Documento Firestore criado com photoURL:', confirmedPhotoURL);
      }

      // Aguardar um pouco para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recarregar novamente para garantir dados mais recentes
      const finalUser = auth.currentUser;
      await finalUser.reload();
      const finalPhotoURL = finalUser.photoURL || confirmedPhotoURL || newPhotoURL;
      
      console.log('✅ Usuário final recarregado. photoURL final:', finalPhotoURL);
      
      // Atualizar usuário global (dashboard, header, etc.) com o usuário atualizado
      try {
        const refreshedUser = await refreshUserProfile(finalUser);
        console.log('✅ Usuário global atualizado. Nova photoURL:', refreshedUser?.photoURL);
        
        if (refreshedUser) {
          setCurrentUser(refreshedUser);
          setFormData(prev => ({
            ...prev,
            displayName: refreshedUser.displayName || prev.displayName,
            photoURL: refreshedUser.photoURL || finalPhotoURL
          }));
          console.log('✅ Estado local sincronizado com usuário global atualizado');
        } else {
          setCurrentUser({ ...finalUser });
          setFormData(prev => ({
            ...prev,
            displayName: finalUser.displayName || prev.displayName,
            photoURL: finalPhotoURL
          }));
          console.log('✅ Estado local atualizado via fallback');
        }
      } catch (refreshError) {
        console.error('Erro ao atualizar usuário global:', refreshError);
        setCurrentUser({ ...finalUser });
        setFormData(prev => ({
          ...prev,
          displayName: finalUser.displayName || prev.displayName,
          photoURL: finalPhotoURL
        }));
      }
      
      setMessage('Foto atualizada com sucesso!');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      setMessage(`Erro ao atualizar foto: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Fechar menu de opções ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (photoOptionsRef.current && !photoOptionsRef.current.contains(event.target)) {
        setShowPhotoOptions(false);
      }
    };

    if (showPhotoOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPhotoOptions]);

  // Limpar preview URL quando o componente desmontar ou quando a foto for salva
  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handleSaveChanges = async () => {
    console.log('🔵 handleSaveChanges chamado', {
      hasCurrentUser: !!currentUser,
      hasSelectedFile: !!selectedFile,
      currentPhotoURL: formData.photoURL,
      previewURL: previewURL
    });

    if (!currentUser) {
      console.warn('⚠️ handleSaveChanges: currentUser é null');
      return;
    }

    try {
      setUploading(true);
      setMessage('Atualizando perfil...');
      
      let newPhotoURL = formData.photoURL;

      // Upload da foto se houver arquivo selecionado
      if (selectedFile) {
        console.log('📤 Iniciando upload da foto...');
        setMessage('Fazendo upload da foto...');
        // Usar timestamp para garantir nome único e evitar cache
        const timestamp = Date.now();
        const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
        const uniqueFileName = `profile_${timestamp}.${fileExtension}`;
        const photoRef = ref(storage, `profile_pictures/${currentUser.uid}/${uniqueFileName}`);
        await uploadBytes(photoRef, selectedFile);
        newPhotoURL = await getDownloadURL(photoRef);
        console.log('✅ Foto enviada com sucesso:', newPhotoURL);
      }

      // Atualizar displayName e photoURL no Firebase Authentication PRIMEIRO
      console.log('📸 Atualizando perfil no Firebase Auth com photoURL:', newPhotoURL);
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: newPhotoURL
      });
      console.log('✅ Firebase Auth atualizado');

      // Recarregar usuário do Firebase Auth IMEDIATAMENTE após updateProfile
      await auth.currentUser.reload();
      const updatedFirebaseUser = auth.currentUser;
      console.log('🔄 Usuário recarregado. Nova photoURL:', updatedFirebaseUser.photoURL);

      // Verificar se a photoURL foi realmente atualizada
      if (updatedFirebaseUser.photoURL !== newPhotoURL) {
        console.warn('⚠️ photoURL não corresponde! Tentando novamente...');
        // Tentar novamente com o novo objeto de usuário
        await updateProfile(updatedFirebaseUser, {
          photoURL: newPhotoURL
        });
        await updatedFirebaseUser.reload();
      }

      // Atualizar dados no Firestore com a URL confirmada
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const confirmedPhotoURL = updatedFirebaseUser.photoURL || newPhotoURL;

      if (userDocSnap.exists()) {
        await setDoc(userDocRef, {
          name: formData.displayName,
          displayName: formData.displayName,
          photoURL: confirmedPhotoURL,
          phone: formData.phone,
          updatedAt: new Date()
        }, { merge: true });
        console.log('✅ Firestore atualizado com photoURL:', confirmedPhotoURL);
      } else {
        // Se o documento do usuário não existir, crie-o
        await setDoc(userDocRef, {
          email: currentUser.email,
          name: formData.displayName,
          displayName: formData.displayName,
          photoURL: confirmedPhotoURL,
          phone: formData.phone,
          createdAt: new Date(),
          completedWorkouts: 0,
          completedWeeks: 0,
          achievements: 0
        });
        console.log('✅ Documento Firestore criado com photoURL:', confirmedPhotoURL);
      }

      // Aguardar um pouco para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recarregar novamente para garantir dados mais recentes
      const finalUser = auth.currentUser;
      await finalUser.reload();
      const finalPhotoURL = finalUser.photoURL || confirmedPhotoURL || newPhotoURL;
      
      console.log('✅ Usuário final recarregado. photoURL final:', finalPhotoURL);

      // PRIMEIRO: Atualizar usuário global (dashboard, header, etc.) com o usuário atualizado
      // Isso garante que o globalCurrentUser seja atualizado antes de sincronizar o estado local
      try {
        const refreshedUser = await refreshUserProfile(finalUser);
        console.log('✅ Usuário global atualizado. Nova photoURL:', refreshedUser?.photoURL);
        
        // Após atualizar o global, atualizar estado local para garantir sincronização
        // O useEffect vai sincronizar automaticamente, mas forçamos aqui para garantir
        if (refreshedUser) {
          setCurrentUser(refreshedUser);
          setFormData(prev => ({
            ...prev,
            displayName: refreshedUser.displayName || prev.displayName,
            photoURL: refreshedUser.photoURL || finalPhotoURL
          }));
          console.log('✅ Estado local sincronizado com usuário global atualizado');
        } else {
          // Fallback: se refreshUserProfile retornar null, atualizar localmente
          setCurrentUser({ ...finalUser });
      setFormData(prev => ({
        ...prev,
        displayName: finalUser.displayName || prev.displayName,
        photoURL: finalPhotoURL
      }));
          console.log('✅ Estado local atualizado via fallback');
        }
      } catch (refreshError) {
        console.error('Erro ao atualizar usuário global:', refreshError);
        // Em caso de erro, atualizar estado local mesmo assim
      setCurrentUser({ ...finalUser });
        setFormData(prev => ({
          ...prev,
          displayName: finalUser.displayName || prev.displayName,
          photoURL: finalPhotoURL
        }));
      }
      
      setSelectedFile(null);
      // Limpar preview URL após upload bem-sucedido
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
      }
      // Limpar flag de edição após salvar
      isEditingPhotoRef.current = false;
      setEditMode(false);
      setMessage('Perfil atualizado com sucesso!');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openCameraPicker = () => {
    if (!openFileInput(cameraInputRef.current, 'camera')) {
      alertFileInputUnavailable('camera');
    }
  };

  const openGalleryPicker = () => {
    if (!openFileInput(galleryInputRef.current, 'galeria')) {
      alertFileInputUnavailable();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    // Validações
    if (!passwordData.currentPassword) {
      setMessage('Por favor, digite sua senha atual');
      return;
    }

    if (!passwordData.newPassword) {
      setMessage('Por favor, digite a nova senha');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('As senhas não coincidem');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setMessage('A nova senha deve ser diferente da senha atual');
      return;
    }

    try {
      setChangingPassword(true);
      setMessage('Alterando senha...');

      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Atualizar a senha
      await updatePassword(currentUser, passwordData.newPassword);

      // Limpar campos
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
      setMessage('Senha alterada com sucesso!');

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      let errorMessage = 'Erro ao alterar senha. Tente novamente.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Senha atual incorreta';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Por segurança, faça login novamente antes de alterar a senha';
          break;
        default:
          errorMessage = `Erro: ${error.message}`;
      }
      
      setMessage(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  // Fallback de segurança
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-lg mb-4">Carregando perfil...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen main-content ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      
      <div className="container mx-auto px-6 py-8 pt-8 pb-32">
        
        <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>Meu Perfil</h1>

        {/* Cabeçalho do Perfil */}
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-8 mb-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Foto de Perfil */}
            <div className="relative" ref={photoOptionsRef}>
              {/* Inputs ocultos para câmera e galeria */}
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <ProfilePhoto
                src={previewURL || formData.photoURL}
                alt="Foto de perfil"
                size="2xl"
                fallbackText={formData.displayName || formData.email}
                fallbackIcon={true}
              />
              <button
                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                className="absolute -bottom-1 -right-1 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer shadow-lg z-10"
                aria-label="Editar foto de perfil"
              >
                <Edit3 size={16} />
              </button>

              {/* Menu de opções (Câmera ou Galeria) */}
              {showPhotoOptions && (
                <div className={`absolute left-0 top-full mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg border overflow-hidden z-50 min-w-[180px]`}>
                  <button
                    onClick={() => {
                      openCameraPicker();
                      setShowPhotoOptions(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <Camera className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Tirar foto</span>
                  </button>
                  <button
                    onClick={() => {
                      openGalleryPicker();
                      setShowPhotoOptions(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Escolher da galeria</span>
                  </button>
                </div>
              )}
            </div>

            {/* Informações Básicas */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formData.displayName || 'Usuário'}
                </h2>
                {isSubscriber && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <Crown size={14} />
                    Assinante
                  </div>
                )}
              </div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formData.email}</p>
            </div>
          </div>
        </div>

        {/* InstaHIIT - Minhas Postagens */}
        {PlatformConfig.isCommunityEnabled && (
          <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2 rounded-lg">
                  <ImageIcon className="text-white" size={20} />
                </div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>InstaHIIT</h3>
              </div>
              <button
                onClick={() => navigate('/community')}
                className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
              >
                Ver todas
              </button>
            </div>
            
            {userPosts.length > 0 ? (
              (() => {
                const postsWithImages = userPosts.filter(post => post.images && post.images.length > 0);
                return postsWithImages.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {postsWithImages.slice(0, 6).map((post) => (
                        <div key={post.id} className={`aspect-square ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden relative group cursor-pointer`}>
                          <img 
                            src={post.images[0]} 
                            alt="Post" 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Overlay com informações */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex items-center gap-4 text-white text-sm">
                              <div className="flex items-center gap-1">
                                <Heart size={16} />
                                <span>{post.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle size={16} />
                                <span>{post.comments?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      {userPosts.length} postagem{userPosts.length !== 1 ? 's' : ''} no InstaHIIT
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="mx-auto text-gray-500 mb-3" size={48} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Você ainda não fez nenhuma postagem com imagem</p>
                    <button
                      onClick={() => navigate('/community')}
                      className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium"
                    >
                      Fazer primeira postagem
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="mx-auto text-gray-500 mb-3" size={48} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Você ainda não fez nenhuma postagem</p>
                <button
                  onClick={() => navigate('/community')}
                  className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium"
                >
                  Fazer primeira postagem
                </button>
              </div>
            )}
          </div>
        )}

        {/* Informações da Conta */}
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 mt-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Informações da Conta</h3>
            <button
              onClick={async () => {
                if (editMode) {
                  // Se está cancelando, limpar preview e arquivo selecionado
                  if (previewURL) {
                    URL.revokeObjectURL(previewURL);
                    setPreviewURL(null);
                  }
                  setSelectedFile(null);
                  // Limpar flag de edição ao cancelar
                  isEditingPhotoRef.current = false;
                  setMessage('');
                  // Recarregar foto original do usuário
                  if (currentUser) {
                    setFormData(prev => ({ ...prev, photoURL: currentUser.photoURL || '' }));
                  }
                }
                setEditMode(!editMode);
              }}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Edit3 size={16} />
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Nome Completo</label>
              {editMode ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="Seu nome completo"
                />
              ) : (
                <div className={`flex items-center gap-2 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  <User className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={16} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formData.displayName || 'Não informado'}</span>
                </div>
              )}
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
              <div className={`flex items-center gap-2 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                <Mail className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formData.email}</span>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Telefone</label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className={`w-full px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              ) : (
                <div className={`flex items-center gap-2 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  <Phone className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={16} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formData.phone || 'Não informado'}</span>
                </div>
              )}
            </div>
          </div>
          
          {editMode && (
            <button
              onClick={() => {
                console.log('🔘 Botão "Salvar Alterações" clicado!');
                handleSaveChanges();
              }}
              disabled={uploading}
              className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          )}
        </div>

        {/* Mensagem de Status - não mostrar durante upload nem mensagens de foto selecionada */}
        {message && !message.includes('Foto selecionada') && !message.includes('Fazendo upload') && !uploading && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            message.includes('sucesso') ? 'bg-green-600 text-white' : 
            message.includes('Erro') ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
          }`}>
            {message}
          </div>
        )}

        {/* Alterar Senha */}
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 mt-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Segurança</h3>
            </div>
            <button
              onClick={() => {
                setShowChangePassword(!showChangePassword);
                if (showChangePassword) {
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }
              }}
              className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
            >
              {showChangePassword ? 'Cancelar' : 'Alterar Senha'}
            </button>
          </div>

          {showChangePassword && (
            <div className="space-y-4 mt-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 pr-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 pr-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    placeholder="Digite a nova senha (mín. 6 caracteres)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 pr-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Botão de Logout */}
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 mt-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-medium"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Modal de Crop Circular para Foto de Perfil */}
      <CircularProfileCropModal
        open={cropModalOpen}
        file={fileToCrop}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

export default Profile;

