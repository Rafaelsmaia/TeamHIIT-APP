import { Play } from 'lucide-react';
import { getYouTubeThumbnailUrl } from '../utils/mediaHelpers.js';

function NativeVideoLaunchCard({
  videoId,
  title = 'Assistir treino',
  description = 'O vídeo abre em uma janela integrada ao app para uma reprodução mais estável.',
  buttonLabel = 'Abrir treino',
  isDarkMode = true,
  onOpen,
}) {
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId, 'hqdefault');

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex aspect-video w-full overflow-hidden rounded-2xl border text-left transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
        isDarkMode
          ? 'border-gray-700 bg-black text-white hover:scale-[1.01]'
          : 'border-gray-200 bg-white text-gray-900 hover:scale-[1.01]'
      }`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/35" />

      <div className="relative z-10 flex h-full w-full flex-col justify-end p-5 sm:p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
          <Play className="h-6 w-6 fill-current" />
        </div>
        <p className="text-xl font-bold text-white sm:text-2xl">{title}</p>
        <p className="mt-2 max-w-lg text-sm text-white/85 sm:text-base">{description}</p>
        <span className="mt-5 inline-flex w-fit items-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30">
          {buttonLabel}
        </span>
      </div>
    </button>
  );
}

export default NativeVideoLaunchCard;
