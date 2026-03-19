import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebaseConfig'
import ImageCropperModal from './ImageCropperModal.jsx'
import { useAspectCropper } from '../../hooks/useAspectCropper.js'
import NotificationService from '../../services/NotificationService.js'
import { COMMUNITY_FALLBACK_IMAGE } from '../../utils/mediaHelpers.js'

function AnnouncementsTab({ isAdmin, currentUser, isDarkMode }) {
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [formVisible, setFormVisible] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    highlight: '',
    message: '',
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const { cropRequest, cancelCrop, confirmCrop, ensurePreset } = useAspectCropper()

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Carregando...'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  const loadAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const announcementsCollection = collection(db, 'announcements');
      const announcementsQuery = query(announcementsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(announcementsQuery);
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setAnnouncements(data);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    }
    setLoadingAnnouncements(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    return () => {
      imagePreview.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url)
        }
      })
    }
  }, [imagePreview])

  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const availableSlots = Math.max(0, 4 - selectedImages.length)
    if (availableSlots === 0) {
      alert('Você já atingiu o limite de 4 imagens por anúncio.')
      return
    }

    if (files.length > availableSlots) {
      alert(`Você só pode adicionar mais ${availableSlots} imagem(ns).`)
    }

    const allowedFiles = files.slice(0, availableSlots)

    for (const file of allowedFiles) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} não é um arquivo de imagem válido.`)
        continue
      }

      try {
        const adjustedFile = await ensurePreset(file)
        if (!adjustedFile) {
          continue
        }

        const previewUrl = URL.createObjectURL(adjustedFile)
        setSelectedImages((prev) => [...prev, adjustedFile])
        setImagePreview((prev) => [
          ...prev,
          {
            url: previewUrl,
            id: `${adjustedFile.name}-${Date.now()}`
          }
        ])
      } catch (error) {
        console.error('Erro ao ajustar imagem:', error)
        alert(`Não foi possível preparar a imagem ${file.name}.`)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index) => {
    const preview = imagePreview[index]
    if (preview?.url) {
      URL.revokeObjectURL(preview.url)
    }
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (announcementId) => {
    if (!currentUser) return []
    const ownerId = currentUser.uid
    console.log('[Announcements] Uploading images as', ownerId)
    const uploadPromises = selectedImages.map(async (file, index) => {
      const uniqueName = `${announcementId}_${Date.now()}_${index}_${file.name}`
      const path = `announcements/${ownerId}/${uniqueName}`
      console.log('[Announcements] Path:', path)
      const imageRef = ref(storage, path)
      const snapshot = await uploadBytes(imageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      return url
    })
    return Promise.all(uploadPromises)
  }

  const clearForm = () => {
    setFormData({ title: '', highlight: '', message: '' })
    imagePreview.forEach((preview) => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    })
    setImagePreview([])
    setSelectedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleForm = () => {
    setFormVisible((prev) => {
      const next = !prev
      if (!next) {
        clearForm()
      }
      return next
    })
  }

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      alert('Insira um título para o anúncio.')
      return
    }
    if (!currentUser) {
      alert('Faça login para publicar anúncio.')
      return
    }

    setSaving(true)
    try {
      const newAnnouncement = {
        title: formData.title.trim(),
        highlight: formData.highlight.trim(),
        message: formData.message.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        images: [],
      }

      const announcementRef = await addDoc(collection(db, 'announcements'), newAnnouncement)

      let uploadedImageUrls = []
      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadImages(announcementRef.id)
        await updateDoc(announcementRef, { images: uploadedImageUrls })
      }

      try {
        await NotificationService.broadcastAnnouncement({
          announcementId: announcementRef.id,
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          highlight: newAnnouncement.highlight,
          authorName: newAnnouncement.authorName,
          imageUrls: uploadedImageUrls
        })
      } catch (notificationError) {
        console.error('Erro ao notificar usuários sobre o anúncio:', notificationError)
      }

      clearForm()
      setFormVisible(false)
      loadAnnouncements()
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error)
      alert('Não foi possível publicar. Tente novamente.')
    }
    setSaving(false)
  }

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Excluir este anúncio?')) return;

    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      setAnnouncements((prev) => prev.filter((item) => item.id !== announcementId));
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      alert('Não foi possível excluir o anúncio.');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} px-6 py-4 flex items-center justify-between`}>
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Anúncios</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Novidades, comunicados e informações importantes para a comunidade.</p>
        </div>
        {isAdmin && (
          <button
            onClick={toggleForm}
            className={`px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white`}
          >
            {formVisible ? 'Cancelar' : 'Novo anúncio'}
          </button>
        )}
      </div>

      {isAdmin && formVisible && (
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-4 md:p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Parceria com marca de suplementos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destaque (opcional)</label>
              <input
                type="text"
                value={formData.highlight}
                onChange={(e) => setFormData((prev) => ({ ...prev, highlight: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Resumo rápido que aparece em destaque"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mensagem</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg h-32 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Detalhes completos do anúncio"
              ></textarea>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Imagens (opcional)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  Selecionar imagens ({selectedImages.length}/4)
                </button>
              </div>
              {imagePreview.length > 0 && (
                <div className="grid gap-2 mt-2 grid-cols-2 md:grid-cols-4">
                  {imagePreview.map((preview, index) => (
                    <div key={preview.id} className="relative">
                      <img
                        src={preview.url}
                        alt={`Pré-visualização ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handlePublish}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-semibold ${saving ? 'bg-gray-500 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {saving ? 'Publicando...' : 'Publicar anúncio'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loadingAnnouncements ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} p-6 animate-pulse`}>
                <div className="flex items-center mb-4">
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} w-10 h-10 rounded-full mr-3`}></div>
                  <div className="flex-1 space-y-2">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} h-4 rounded w-32`}></div>
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded w-20`}></div>
                  </div>
                </div>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded w-full mb-2`}></div>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded w-3/4`}></div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-6 text-center border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4 text-white text-xl">
              📢
            </div>
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Nenhum anúncio ainda</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Os comunicados da equipe aparecerão aqui.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold`}>
                      {(announcement.authorName || 'Equipe Team HIIT').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{announcement.authorName || 'Equipe Team HIIT'}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatTimestamp(announcement.createdAt)}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className={`text-sm font-medium ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                    >
                      Excluir
                    </button>
                  )}
                </div>

                <h3 className={`text-lg font-semibold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{announcement.title}</h3>
                {announcement.highlight && (
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{announcement.highlight}</p>
                )}
                {announcement.message && (
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-3 leading-relaxed`}>{announcement.message}</p>
                )}
              </div>

              {announcement.images && announcement.images.length > 0 && (
                <div className="px-6 pb-4">
                  <div className={`grid gap-4 ${announcement.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {announcement.images.map((url, index) => (
                      <div
                        key={`${announcement.id}-image-${index}`}
                        className="w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800/40"
                      >
                        <img
                          src={url}
                          alt={`Imagem do anúncio ${index + 1}`}
                          className="w-full h-auto object-contain"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = COMMUNITY_FALLBACK_IMAGE
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <ImageCropperModal
        open={Boolean(cropRequest)}
        file={cropRequest?.file || null}
        request={cropRequest}
        onCancel={cancelCrop}
        onConfirm={confirmCrop}
      />
    </div>
  );
}

export default AnnouncementsTab;


