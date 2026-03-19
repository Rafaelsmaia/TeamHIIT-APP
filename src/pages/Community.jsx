import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from '../components/ui/BottomNavigation.jsx';
import Header from '../components/ui/Header.jsx';
import { COMMUNITY_FALLBACK_IMAGE } from '../utils/mediaHelpers.js';
// Componente de imagem otimizado para Community
const CommunityImage = ({ src, alt, className, fallbackSrc = COMMUNITY_FALLBACK_IMAGE, style, onClick }) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se é uma URL de blob (local) - não deve usar crossOrigin
  const isBlobUrl = src && src.startsWith('blob:');

  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    
    // Adicionar crossOrigin para URLs remotas (não blob)
    if (!src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
    };

    img.src = src;
  }, [src, fallbackSrc]);

  return (
    <div className={`relative ${className}`} style={style} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="w-3 h-3 border border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}
        loading="eager"
        {...(!isBlobUrl && { crossOrigin: "anonymous" })}
        referrerPolicy="no-referrer"
        style={{
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          ...style
        }}
      />
    </div>
  );
};
import { useTheme } from '../contexts/ThemeContext.jsx';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Send, ThumbsUp, MessageCircle, PlusCircle, Camera, Image, X, Heart, MoreHorizontal } from 'lucide-react';
import { reportContent, blockUser, loadBlockedUserIds } from '../services/ModerationService';
import AnnouncementsTab from '../components/community/AnnouncementsTab.jsx'

// Cache global para posts da comunidade
let communityPostsCache = null;
let postsLastFetch = null;
const POSTS_CACHE_DURATION = 300000; // 5 minutos

// Função para limpar o cache da comunidade
export const clearCommunityCache = () => {
  communityPostsCache = null;
  postsLastFetch = null;
  console.log('🧹 Cache da comunidade limpo');
};

// Função para verificar o estado do cache da comunidade
export const getCommunityCacheStatus = () => {
  const now = Date.now();
  return {
    hasData: !!communityPostsCache,
    lastFetch: postsLastFetch,
    isExpired: postsLastFetch ? (now - postsLastFetch) >= POSTS_CACHE_DURATION : true,
    cacheAge: postsLastFetch ? Math.round((now - postsLastFetch) / 1000) : null
  };
};

function Community() {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [commentContent, setCommentContent] = useState({});
  const [showComments, setShowComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInteractions, setUserInteractions] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const [compressingImages, setCompressingImages] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoOptionsRef = useRef(null);
  const mainContentRef = useRef(null);
  const [moreMenuForPost, setMoreMenuForPost] = useState(null);
  const [moreMenuForComment, setMoreMenuForComment] = useState({});
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());

  const auth = getAuth();

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      if (mainContentRef.current && typeof mainContentRef.current.scrollTo === 'function') {
        mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });
  }, []);

  // Scroll para o topo quando a página é carregada
  useEffect(() => {
    scrollToTop();

    const timeoutId = setTimeout(scrollToTop, 120);
    return () => clearTimeout(timeoutId);
  }, [scrollToTop]);

  // Scroll para o topo quando a rota mudar (navegação entre abas)
  useEffect(() => {
    scrollToTop();
  }, [location.pathname, scrollToTop]);

  // Scroll para o topo quando mudar entre abas (Feed/Anúncios)
  useEffect(() => {
    scrollToTop();
  }, [activeTab, scrollToTop]);

  // Tratamento global de erros de Promise para evitar que apareçam para o usuário
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Promise rejeitada capturada:', event.reason);
      event.preventDefault(); // Previne que o erro apareça no console do usuário
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Fechar menu de opções de foto quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (photoOptionsRef.current && !photoOptionsRef.current.contains(event.target)) {
        setShowPhotoOptions(false);
      }
    };

    if (showPhotoOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhotoOptions]);

  // Verificar se há uma imagem pendente do botão de câmera do BottomNavigation
  useEffect(() => {
    const pendingImage = sessionStorage.getItem('pendingPostImage');
    const pendingImageName = sessionStorage.getItem('pendingPostImageName');
    const pendingImageType = sessionStorage.getItem('pendingPostImageType');
    
    if (pendingImage) {
      // Converter base64 de volta para File
      fetch(pendingImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], pendingImageName || 'photo.jpg', { 
            type: pendingImageType || 'image/jpeg' 
          });
          setSelectedImages([file]);
          setImagePreview([pendingImage]);
          
          // Limpar sessionStorage
          sessionStorage.removeItem('pendingPostImage');
          sessionStorage.removeItem('pendingPostImageName');
          sessionStorage.removeItem('pendingPostImageType');
        });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        fetchUserInteractions(user.uid);
        // carregar lista de bloqueados
        loadBlockedUserIds(user.uid).then(setBlockedUserIds).catch(() => setBlockedUserIds(new Set()));
        // verificar se é admin
        getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setIsAdmin(Boolean(data?.isAdmin));
          } else {
            setIsAdmin(false);
          }
        }).catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, [auth]);

  // Verificar se há foto vindo do modal da câmera
  useEffect(() => {
    if (location.state?.newPhoto && location.state?.photoPreview) {
      // Adicionar a foto às imagens selecionadas
      setSelectedImages(prev => [...prev, location.state.newPhoto]);
      
      // Criar preview com estrutura correta
      const newPreview = {
        file: location.state.newPhoto,
        url: location.state.photoPreview,
        id: Date.now() + Math.random(),
        originalSize: location.state.newPhoto.size || 0,
        compressedSize: location.state.newPhoto.size || 0,
        compressionRatio: 0
      };
      
      setImagePreview(prev => [...prev, newPreview]);
      
      // Limpar o state da navegação
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Função para comprimir imagem - VERSÃO MELHORADA E ROBUSTA
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      try {
        // Verificar se Image está disponível
        if (!window.Image) {
          console.warn('Image constructor não disponível, usando arquivo original');
          resolve({
            blob: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0
          });
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          try {
            // Calcular dimensões mantendo proporção
            let { width, height } = img;
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para blob comprimido
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    blob: blob,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    compressionRatio: Math.round((1 - blob.size / file.size) * 100)
                  });
                } else {
                  // Fallback: usar arquivo original
                  resolve({
                    blob: file,
                    originalSize: file.size,
                    compressedSize: file.size,
                    compressionRatio: 0
                  });
                }
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            console.warn('Erro na compressão, usando arquivo original:', error);
            resolve({
              blob: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0
            });
          }
        };
        
        img.onerror = () => {
          console.warn('Erro ao carregar imagem, usando arquivo original');
          resolve({
            blob: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0
          });
        };
        
        img.src = URL.createObjectURL(file);
        
      } catch (error) {
        console.warn('Erro geral na compressão, usando arquivo original:', error);
        resolve({
          blob: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0
        });
      }
    });
  };

  // Buscar interações do usuário atual
  const fetchUserInteractions = async (userId) => {
    try {
      const interactionsCollection = collection(db, 'userInteractions', userId, 'posts');
      const querySnapshot = await getDocs(interactionsCollection);
      const interactions = {};
      querySnapshot.docs.forEach(doc => {
        interactions[doc.id] = doc.data();
      });
      setUserInteractions(interactions);
    } catch (error) {
      console.error('Erro ao buscar interações do usuário:', error);
    }
  };


  const fetchPosts = async () => {
    // Verificar se temos dados em cache e se ainda são válidos
    const now = Date.now();
    if (communityPostsCache && postsLastFetch && (now - postsLastFetch) < POSTS_CACHE_DURATION) {
      console.log('📦 Usando posts do cache');
      setPosts(communityPostsCache);
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Primeiro, carregar dados básicos dos posts
      const basicPosts = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        authorPhotoURL: '', // Será preenchido depois
        commentsList: [] // Será preenchido depois
      }));
      
      // Depois, carregar fotos e comentários em paralelo
      const enhancedPosts = await Promise.all(basicPosts.map(async (postData) => {
        const promises = [];
        
        // Buscar foto do autor
        if (postData.authorId) {
          promises.push(
            getDoc(doc(db, 'users', postData.authorId)).then(userDocSnap => {
              return userDocSnap.exists() ? userDocSnap.data().photoURL || '' : '';
            }).catch(() => '')
          );
        } else {
          promises.push(Promise.resolve(''));
        }
        
        // Buscar comentários
        promises.push(
          getDocs(query(collection(db, 'posts', postData.id, 'comments'), orderBy('timestamp', 'asc')))
            .then(commentsSnapshot => {
              return Promise.all(commentsSnapshot.docs.map(async commentDoc => {
                const commentData = { id: commentDoc.id, ...commentDoc.data() };
                
                // Buscar foto do comentarista
                let commenterPhotoURL = '';
                if (commentData.authorId) {
                  try {
                    const userDocSnap = await getDoc(doc(db, 'users', commentData.authorId));
                    commenterPhotoURL = userDocSnap.exists() ? userDocSnap.data().photoURL || '' : '';
                  } catch (error) {
                    console.warn('Erro ao buscar foto do comentarista:', error);
                  }
                }
                return { ...commentData, authorPhotoURL: commenterPhotoURL };
              }));
            }).catch(() => [])
        );
        
        const [authorPhotoURL, commentsList] = await Promise.all(promises);
        return { ...postData, authorPhotoURL, commentsList };
      }));
      
      // Salvar no cache
      communityPostsCache = enhancedPosts;
      postsLastFetch = Date.now();
      console.log('💾 Posts salvos no cache');
      
      setPosts(enhancedPosts);
      
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    }
    
    setLoadingPosts(false);
  };

  // Atualizar um post específico sem recarregar todos
  const updatePostInState = (postId, updates) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  };

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload de imagens em background após posts carregados
  useEffect(() => {
    if (posts.length > 0) {
      const imageUrls = [];
      
      // Coletar URLs de imagens dos posts
      posts.forEach(post => {
        if (post.authorPhotoURL) {
          imageUrls.push(post.authorPhotoURL);
        }
        if (post.images && post.images.length > 0) {
          imageUrls.push(...post.images);
        }
        if (post.commentsList) {
          post.commentsList.forEach(comment => {
            if (comment.authorPhotoURL) {
              imageUrls.push(comment.authorPhotoURL);
            }
          });
        }
      });

      // Remover URLs duplicadas
      const uniqueImageUrls = [...new Set(imageUrls)];
      
      // Preload silencioso em background
      uniqueImageUrls.forEach(url => {
        const img = new window.Image();
        img.src = url;
      });
      
      console.log(`🖼️ [Community] ${uniqueImageUrls.length} imagens pré-carregadas em background`);
    }
  }, [posts]);


  // Função para selecionar e comprimir imagens - VERSÃO MELHORADA
  const handleImageSelect = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) {
      return;
    }

    const availableSlots = Math.max(0, 4 - selectedImages.length);
    if (availableSlots === 0) {
      alert('Você já atingiu o limite de 4 imagens por post.');
      return;
    }

    if (incomingFiles.length > availableSlots) {
      alert(`Você só pode adicionar mais ${availableSlots} imagem(ns).`);
    }

    const filesToProcess = incomingFiles.slice(0, availableSlots);

    setCompressingImages(true);

    try {
      const processedImages = [];
      const newPreviews = [];

      for (const file of filesToProcess) {
        if (file.size > 50 * 1024 * 1024) {
          alert(`A imagem ${file.name} é muito grande. Máximo 50MB por imagem.`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          alert(`${file.name} não é um arquivo de imagem válido.`);
          continue;
        }

        // Usar arquivo diretamente sem crop
        const fileToProcess = file;

        try {
          let finalResult = await compressImage(fileToProcess);

          if (finalResult.compressedSize > 5 * 1024 * 1024) {
            finalResult = await compressImage(fileToProcess, 800, 0.6);
            if (finalResult.compressedSize > 5 * 1024 * 1024) {
              finalResult = await compressImage(fileToProcess, 600, 0.5);
            }
          }

          if (finalResult.compressedSize > 5 * 1024 * 1024) {
            alert(`${file.name} não pôde ser comprimida suficientemente. Tente uma imagem menor.`);
            continue;
          }

          const finalFile = new File([
            finalResult.blob
          ], fileToProcess.name || file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          processedImages.push(finalFile);
          const previewUrl = URL.createObjectURL(finalResult.blob);
          newPreviews.push({
            file: finalFile,
            url: previewUrl,
            id: Date.now() + Math.random(),
            originalSize: fileToProcess.size,
            compressedSize: finalResult.compressedSize,
            compressionRatio: finalResult.compressionRatio
          });
        } catch (compressionError) {
          console.warn(`Erro na compressão de ${file.name}:`, compressionError);

          if (fileToProcess.size <= 5 * 1024 * 1024) {
            processedImages.push(fileToProcess);
            const previewUrl = URL.createObjectURL(fileToProcess);
            newPreviews.push({
              file: fileToProcess,
              url: previewUrl,
              id: Date.now() + Math.random(),
              originalSize: fileToProcess.size,
              compressedSize: fileToProcess.size,
              compressionRatio: 0
            });
          } else {
            alert(`${file.name} é muito grande e não pôde ser processada.`);
          }
        }
      }

      if (processedImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...processedImages]);
        setImagePreview((prev) => [...prev, ...newPreviews]);
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      alert('Erro ao processar imagens. Tente novamente.');
    } finally {
      setCompressingImages(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Remover imagem selecionada
  const removeImage = (index) => {
    // Limpar URL do preview para evitar memory leak
    if (imagePreview[index]?.url) {
      URL.revokeObjectURL(imagePreview[index].url);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Upload de imagens para Firebase Storage
  const uploadImages = async (images) => {
    const uploadPromises = images.map(async (image, index) => {
      const timestamp = Date.now();
      const imageRef = ref(storage, `community/${currentUser.uid}/${timestamp}_${index}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      return await getDownloadURL(snapshot.ref);
    });
    return await Promise.all(uploadPromises);
  };

  const handleAddPost = async () => {
    if (newPostContent.trim() === '' && selectedImages.length === 0) {
      alert('Adicione um texto ou pelo menos uma imagem para publicar.');
      return;
    }
    if (!currentUser) {
      alert('Você precisa estar logado para fazer uma postagem.');
      return;
    }

    setUploadingPost(true);
    try {
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
      }

      await addDoc(collection(db, 'posts'), {
        content: newPostContent,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        images: imageUrls,
        type: imageUrls.length > 0 ? 'photo' : 'text'
      });
      
      setNewPostContent('');
      setSelectedImages([]);
      
      // Limpar previews e URLs
      imagePreview.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
      setImagePreview([]);
      
      // Invalidar cache e recarregar posts
      communityPostsCache = null;
      postsLastFetch = null;
      fetchPosts(); // Recarregar apenas quando adicionar novo post
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
      alert('Erro ao publicar post. Tente novamente.');
    }
    setUploadingPost(false);
  };

  const handleLikePost = async (postId) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir uma postagem.');
      return;
    }

    const userInteraction = userInteractions[postId];
    const hasLiked = userInteraction?.liked;

    try {
      const postRef = doc(db, 'posts', postId);
      const userInteractionRef = doc(db, 'userInteractions', currentUser.uid, 'posts', postId);

      if (hasLiked) {
        // Remover curtida
        await updateDoc(postRef, {
          likes: increment(-1)
        });
        await deleteDoc(userInteractionRef);
        
        // Atualizar estado local
        setUserInteractions(prev => {
          const newInteractions = { ...prev };
          delete newInteractions[postId];
          return newInteractions;
        });
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        updatePostInState(postId, { likes: currentPost.likes - 1 });
      } else {
        // Adicionar curtida
        await updateDoc(postRef, {
          likes: increment(1)
        });
        
        await setDoc(userInteractionRef, {
          liked: true,
          timestamp: serverTimestamp()
        });
        
        // Atualizar estado local
        setUserInteractions(prev => ({
          ...prev,
          [postId]: { liked: true, timestamp: new Date() }
        }));
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        updatePostInState(postId, { likes: currentPost.likes + 1 });
      }
    } catch (e) {
      console.error('Erro ao curtir post: ', e);
    }
  };

  // Moderação: report e bloqueio
  const handleReportPost = async (post) => {
    if (!currentUser) return alert('Faça login para reportar.');
    const reason = window.prompt('Reason for report (optional):', 'inappropriate');
    try {
      await reportContent({
        reporterId: currentUser.uid,
        targetId: post.id,
        targetAuthorId: post.authorId,
        type: 'post',
        reason: reason || 'inappropriate',
        context: { snippet: (post.content || '').slice(0, 140) }
      });
      alert('Report enviado. Obrigado.');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar report.');
    } finally {
      setMoreMenuForPost(null);
    }
  };

  const handleBlockUser = async (targetUserId) => {
    if (!currentUser) return alert('Faça login para bloquear.');
    if (currentUser.uid === targetUserId) return;
    try {
      await blockUser({ userId: currentUser.uid, blockedUserId: targetUserId });
      const ids = new Set(blockedUserIds);
      ids.add(targetUserId);
      setBlockedUserIds(ids);
      alert('Usuário bloqueado.');
    } catch (e) {
      console.error(e);
      alert('Erro ao bloquear usuário.');
    } finally {
      setMoreMenuForPost(null);
    }
  };

  // Edição/Exclusão para o autor do post
  const handleEditPost = async (post) => {
    const newContent = window.prompt('Editar conteúdo do post:', post.content || '');
    if (newContent === null) return; // cancelado
    try {
      await updateDoc(doc(db, 'posts', post.id), { content: newContent });
      updatePostInState(post.id, { content: newContent });
      setMoreMenuForPost(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao editar post.');
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Excluir este post? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setMoreMenuForPost(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir post.');
    }
  };

  const handleCommentPost = async (postId) => {
    const content = commentContent[postId];
    if (!content || content.trim() === '') return;
    if (!currentUser) {
      alert('Você precisa estar logado para comentar uma postagem.');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        content: content,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'posts', postId, 'comments'), newComment);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      // Atualizar estado local
      const currentPost = posts.find(p => p.id === postId);
      const newCommentWithId = {
        ...newComment,
        id: Date.now().toString(), // ID temporário
        timestamp: new Date()
      };
      
      updatePostInState(postId, {
        comments: currentPost.comments + 1,
        commentsList: [...(currentPost.commentsList || []), newCommentWithId]
      });
      
      setCommentContent(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error('Erro ao comentar post: ', e);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <Header />
      
      <div ref={mainContentRef} className="main-content pt-[4.5rem] pb-32">
        <div className="container mx-auto px-6">
        
        {/* Tab Navigation */}
        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} mb-8`}>
          <button
            className={`px-4 md:px-6 py-3 text-sm md:text-lg font-medium ${activeTab === 'feed' ? 'border-b-2 border-blue-500 text-blue-500' : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`px-4 md:px-6 py-3 text-sm md:text-lg font-medium ${activeTab === 'announcements' ? 'border-b-2 border-blue-500 text-blue-500' : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('announcements')}
          >
            Anúncios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Post Creation Form */}
            <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-4 md:p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-start space-x-3 mb-4">
                {currentUser?.photoURL ? (
                  <CommunityImage 
                    src={currentUser.photoURL} 
                    alt="Your Avatar" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    className={`w-full p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                    rows="3"
                    placeholder={currentUser ? "Compartilhe seus resultados, dicas ou motivação..." : "Faça login para postar..."}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={!currentUser}
                  ></textarea>
                </div>
              </div>

              {/* Image Preview - CORRIGIDO PARA MANTER PROPORÇÕES */}
              {imagePreview.length > 0 && (
                <div className="mb-4">
                  <div className={`grid gap-2 ${imagePreview.length === 1 ? 'grid-cols-1' : imagePreview.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {imagePreview.map((preview, index) => (
                      <div key={preview.id} className="relative group">
                        <img 
                          src={preview.url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full object-contain rounded-lg bg-gray-900"
                          style={{ maxHeight: '300px', height: 'auto' }}
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Input para câmera (tirar foto) */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={(e) => {
                      handleImageSelect(e);
                      setShowPhotoOptions(false);
                    }}
                    multiple
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  {/* Input para galeria (escolher foto existente) */}
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={(e) => {
                      handleImageSelect(e);
                      setShowPhotoOptions(false);
                    }}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  {/* Botão com dropdown de opções */}
                  <div className="relative" ref={photoOptionsRef}>
                  <button
                      onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                    disabled={!currentUser || selectedImages.length >= 4 || compressingImages}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      currentUser && selectedImages.length < 4 && !compressingImages
                        ? isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                        : isDarkMode ? 'bg-gray-600 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Foto</span>
                  </button>
                    
                    {/* Dropdown de opções */}
                    {showPhotoOptions && (
                      <div className={`absolute left-0 bottom-full mb-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg border overflow-hidden z-50 min-w-[180px]`}>
                        <button
                          onClick={() => {
                            cameraInputRef.current?.click();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <Camera className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium">Tirar foto</span>
                        </button>
                        <button
                          onClick={() => {
                            galleryInputRef.current?.click();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <Image className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium">Escolher da galeria</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedImages.length > 0 && (
                    <span className="text-xs text-gray-400">{selectedImages.length}/4 imagens</span>
                  )}
                </div>
                <button
                  className={`font-bold py-2 px-6 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                    currentUser && !uploadingPost && !compressingImages
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 cursor-not-allowed text-gray-400'
                  }`}
                  onClick={handleAddPost}
                  disabled={!currentUser || uploadingPost || compressingImages}
                >
                  {uploadingPost ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Publicar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Feed Posts */}
            {loadingPosts ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                      <div>
                        <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-40 bg-gray-700 rounded mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-6 text-center border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Nenhum post ainda</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Seja o primeiro a compartilhar sua jornada fitness!</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!currentUser}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUser
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentUser ? 'Compartilhar Foto' : 'Faça login para postar'}
                </button>
              </div>
            ) : (
              posts.map((post) => {
                const userInteraction = userInteractions[post.id];
                const hasLiked = userInteraction?.liked;
                
                // Ocultar posts de autores bloqueados
                if (blockedUserIds.has(post.authorId)) return null;
                return (
                  <div key={post.id} className={`mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    {/* Post Header */}
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {post.authorPhotoURL ? (
                            <CommunityImage 
                              src={post.authorPhotoURL} 
                              alt="User Avatar" 
                              className="w-10 h-10 rounded-full mr-3 object-cover" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full mr-3 bg-gray-700 flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{post.author}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...'}</p>
                          </div>
                        </div>
                        <div className="relative">
                          <button className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => setMoreMenuForPost(moreMenuForPost === post.id ? null : post.id)}>
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {moreMenuForPost === post.id && (
                            <div className={`absolute right-0 mt-2 w-44 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}>
                              {currentUser && currentUser.uid === post.authorId ? (
                                <>
                                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleEditPost(post)}>Editar</button>
                                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600" onClick={() => handleDeletePost(post)}>Excluir</button>
                                </>
                              ) : (
                                <>
                                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleReportPost(post)}>Reportar</button>
                                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleBlockUser(post.authorId)}>Bloquear usuário</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      {post.content && (
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-3 leading-relaxed`}>{post.content}</p>
                      )}
                    </div>

                    {/* Post Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="px-6 py-3">
                        <div className={`grid gap-2 rounded-lg overflow-hidden ${
                          post.images.length === 1 ? 'grid-cols-1' : 
                          post.images.length === 2 ? 'grid-cols-2' : 
                          post.images.length === 3 ? 'grid-cols-2' : 
                          'grid-cols-2'
                        }`}>
                          {post.images.map((imageUrl, index) => (
                            <div key={index} className={`relative ${
                              post.images.length === 1 ? 'col-span-1' :
                              post.images.length === 3 && index === 0 ? 'col-span-2' :
                              'col-span-1'
                            }`}>
                              <CommunityImage 
                                src={imageUrl} 
                                alt={`Post image ${index + 1}`} 
                                className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity bg-gray-900`}
                                style={{ 
                                  maxHeight: post.images.length === 1 ? '500px' : '300px',
                                  height: 'auto',
                                  width: '100%'
                                }}
                                onClick={() => {
                                  // Implementar modal de visualização de imagem
                                  window.open(imageUrl, '_blank');
                                }}
                              />
                              {post.images.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">+{post.images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-6">
                          <button 
                            className={`flex items-center space-x-2 transition-colors ${
                              currentUser 
                                ? hasLiked 
                                  ? 'text-blue-500 hover:text-blue-400' 
                                  : 'hover:text-blue-500'
                                : 'cursor-not-allowed text-gray-500'
                            }`}
                            onClick={() => handleLikePost(post.id)}
                            disabled={!currentUser}
                          >
                            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} /> 
                            <span className="text-sm font-medium">{post.likes || 0}</span>
                          </button>
                          <button 
                            className={`flex items-center space-x-2 ${currentUser ? 'hover:text-blue-500' : 'cursor-not-allowed text-gray-500'}`}
                            onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            disabled={!currentUser}
                          >
                            <MessageCircle className="w-5 h-5" /> 
                            <span className="text-sm font-medium">{post.comments || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div className="flex items-center space-x-3 mb-4">
                        {currentUser?.photoURL ? (
                          <CommunityImage src={currentUser.photoURL} alt="Your Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center text-gray-400`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                        )}
                        <input
                          type="text"
                          className={`flex-grow p-3 rounded-full text-sm ${currentUser ? (isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500') : isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                          placeholder={currentUser ? "Adicione um comentário..." : "Faça login para comentar..."}
                          value={commentContent[post.id] || ''}
                          onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                          disabled={!currentUser}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCommentPost(post.id);
                            }
                          }}
                        />
                        <button
                          className={`p-2 rounded-full transition-colors duration-200 ${currentUser ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                          onClick={() => handleCommentPost(post.id)}
                          disabled={!currentUser}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Comments List */}
                      {showComments[post.id] && post.commentsList && post.commentsList.length > 0 && (
                        <div className="space-y-3">
                          {post.commentsList.map(comment => (
                            blockedUserIds.has(comment.authorId) ? null : (
                            <div key={comment.id} className="flex items-start space-x-3">
                              {comment.authorPhotoURL ? (
                                <CommunityImage src={comment.authorPhotoURL} alt="Commenter Avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center text-gray-400`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                  </svg>
                                </div>
                              )}
                              <div className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3`}>
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{comment.author}</p>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{comment.timestamp ? new Date(comment.timestamp.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleString() : 'Carregando...'}</p>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.content}</p>
                                <div className="flex justify-end">
                                  <div className="relative">
                                    <button className="p-1 rounded hover:bg-gray-700" onClick={() => setMoreMenuForComment(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}>
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {moreMenuForComment[comment.id] && (
                                      <div className={`absolute right-0 mt-2 w-40 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}>
                                        <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={async () => {
                                          await reportContent({ reporterId: currentUser.uid, targetId: `${post.id}:${comment.id}`, targetAuthorId: comment.authorId, type: 'comment', reason: 'inappropriate', context: { postId: post.id } });
                                          setMoreMenuForComment(prev => ({ ...prev, [comment.id]: false }));
                                          alert('Comentário reportado.');
                                        }}>Reportar</button>
                                        <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={async () => {
                                          await blockUser({ userId: currentUser.uid, blockedUserId: comment.authorId });
                                          const ids = new Set(blockedUserIds); ids.add(comment.authorId); setBlockedUserIds(ids);
                                          setMoreMenuForComment(prev => ({ ...prev, [comment.id]: false }));
                                          alert('Usuário bloqueado.');
                                        }}>Bloquear usuário</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab
            isAdmin={isAdmin}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
          />
        )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

export default Community;

